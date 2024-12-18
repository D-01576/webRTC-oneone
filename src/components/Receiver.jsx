import { useEffect, useRef } from "react"


export const Receiver = () => {
    const selfVideo = useRef();
    const userVideo = useRef();
    
    useEffect(() => {
        const socket = new WebSocket('ws://192.168.18.222:8080');
        console.log(socket)
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }
        startReceiving(socket);
    }, []);

    function startReceiving(socket) {
        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            // console.log(event);
            // const mediaStream = new MediaStream([event.track]);
            // userVideo.current.srcObject = mediaStream;
        };        

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
                setTimeout(() => {
                    const newmedia = new MediaStream();
                    console.log("triggered")
                    const track1 = pc.getTransceivers()[0].receiver.track
                    console.log(track1)
                    newmedia.addTrack(track1);
                    const track2 = pc.getTransceivers()[1].receiver.track
                    console.log(track2)
                    newmedia.addTrack(track2);
                    // userVideo.current.srcObject.addTrack(track1)
                    userVideo.current.srcObject = newmedia;
                    userVideo.current.play()
                }, 10000);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }
        getCameraStreamAndSend(pc)
    }

    const getCameraStreamAndSend = (pc) => {
        navigator.mediaDevices.getUserMedia({ video: true ,audio : true }).then((stream) => {
            const tracks = stream.getVideoTracks()[0];
            const audiotrack = stream.getAudioTracks()[0];
            pc?.addTrack(tracks)
            pc?.addTrack(audiotrack)
            selfVideo.current.srcObject = new MediaStream([tracks]);
        });
    }

    return <div>
        <div>
            <h2>ME</h2>
        <video autoPlay width={400} height={400} ref={selfVideo} />
        </div>
        <div>
            <h2>YOU</h2>
        <video autoPlay width={400} height={400} ref={userVideo} />
        </div>
    </div>
}