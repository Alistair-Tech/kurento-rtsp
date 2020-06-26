const socket=io(':8443', {secure: true});

let peerInfo = new Array(); // Array of all WebRTC peers and their RTSP URI
let RtcPeer;
let count=0; // Keeps track of number of video streams

const $add1 =document.querySelector('#add1');
const $div1 =document.querySelector('#div1');

// Dynamic addition of HTML for new video streams
$add1.addEventListener('click',() => {
    console.log('new fields added');
    $div1.insertAdjacentHTML('beforeend',`<video id="output-${count}" autoplay></video><br>
        <input id="input-${count}" type="text" placeholder="input RTSP link">
        <button id="submit-${count}">Submit</button><br><br>
        <button id="start-${count}">Start</button>
        <button id="stop-${count}">Stop</button><br><br>`);
    count++;
    peerInfo.push({})
})

let itemid,splitid;

// Event delegation code for all streams, checks for 'submit', 'start' and 'stop'
$div1.addEventListener('click',(event) => {
    
    itemid = event.target.id;
    
    splitid=itemid.split('-');

    buttonType=splitid[0]
    num=splitid[1]
    
    // Store submitted URL
    if(buttonType=='submit'){
        console.log('submit registered');
        let currinput = document.querySelector(`#input-${num}`);
        peerInfo[num].id=num;
        peerInfo[num].url =currinput.value;
        currinput.value="";
    }
    
    // Stop the stream and dispose the WebRTC peer
    else if(buttonType=='stop'){
        console.log('stop registered');
        let curroutput = document.querySelector(`#output-${num}`);
        curroutput.srcObject=null;
        peerInfo[num].rtcPeer.dispose()
        peerInfo[num].rtcPeer = null;
    }
    
    // Creates WebRTC peer for the URL and sends SDP offer
    else if(buttonType=='start'){
        console.log('start registered');
        let curroutput = document.querySelector(`#output-${num}`);
        console.log(curroutput.id);
        
        RtcPeer=kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly({
            remoteVideo: curroutput,
            onicecandidate : iceCandidate
            }, function (error) {
                if (error){
                    console.log(error)
                }
        })

        peerInfo[num]["rtcPeer"]=RtcPeer

        RtcPeer.generateOffer((error,offer)=> {
            if (error){
                console.log(error)
            }
            socket.emit('sdpOffer',offer,peerInfo[num].url,num);
        })
    }
})

// Passed into WebRTC peer constuctor, receives and emits ICE candidates
function iceCandidate(candidate){
    socket.emit('initice', candidate)
}

// Receives and processes SDP answer from server-side
socket.on('sdpAnswer', (answer, number) => {
    peerInfo[number].rtcPeer.processAnswer(answer)
    console.log("answer")
})

// Receives and adds ICE candidates
socket.on('finalice', (candidate, number) => {
    peerInfo[number].rtcPeer.addIceCandidate(candidate);
    })

// Listens for errors
socket.on('problem', (message)=> {
    console.log(message);
})
