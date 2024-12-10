import { useEffect, useRef, useState } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState(null);
    const [pc, setPC] = useState(null);
    const selfVideo = useRef();
    const userVideo = useRef();

    useEffect(() => {
        const socket = new WebSocket('ws://192.168.18.222:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const initiateConn = async () => {

        if (!socket) {
            alert("Socket not found");
            return;
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
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
                }, 5000);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }

        const pc = new RTCPeerConnection();
        setPC(pc);
        pc.ontrack = (event) => {
            // console.log(event)
            // userVideo.current.srcObject = new MediaStream([event.track]);
        }
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        }
            
        getCameraStreamAndSend(pc);
    }

    const getCameraStreamAndSend = (pc) => {
        navigator.mediaDevices.getUserMedia({ video: true,audio : true }).then((stream) => {
            const tracks = stream.getVideoTracks()[0];
            const audiotrack = stream.getAudioTracks()[0];
            pc?.addTrack(tracks)
            pc?.addTrack(audiotrack)
            selfVideo.current.srcObject = new MediaStream([tracks]);
        });
    }

    return <div>
        Sender
        <button onClick={initiateConn}> Send data </button>
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