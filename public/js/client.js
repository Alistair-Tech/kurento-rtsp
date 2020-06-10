const socket=io(':8443', {secure: true});

const $startbutton = document.querySelector('#main');
const $video1 =  document.querySelector('#input');
const $video2 = document.querySelector('#output');
const $stopbutton = document.querySelector('#stop');
const $mirror = document.querySelector('#wstart');

$stopbutton.setAttribute('disabled', 'disabled')
// $mirror.setAttribute('disabled', 'disabled')

let videostream = null;
let RtcPeer;

$startbutton.addEventListener('click', ()=> {
    

    console.log("hu")

    const success = (mediaStream)=> {
        videostream = mediaStream;
        $video1.srcObject = mediaStream;
        console.log('hah')
        $startbutton.setAttribute('disabled', 'disabled');
        $stopbutton.removeAttribute('disabled');
        // $mirror.removeAttribute('disabled');
    }

    const failure = (error)=> {
        console.log(error);
    }

    navigator.mediaDevices.getUserMedia({video :true})
    .then(success).catch(failure);
})

$stopbutton.addEventListener('click', () => {
    videostream.getTracks().forEach(function(track) {
        track.stop();
    });
    $video1.srcObject=null;
    $startbutton.removeAttribute('disabled');
    $stopbutton.setAttribute('disabled', 'disabled');

})

$mirror.addEventListener('click',() => {
    RtcPeer=kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv({
        localVideo: $video1,
        remoteVideo: $video2,
        onicecandidate : iceCandidate
    }, function (error) {
        if (error){
            console.log(error)
        }
        console.log("dne")
    }) 

    RtcPeer.generateOffer((error,offer)=> {
        console.log(error)
        socket.emit('sdpOffer',offer);
        console.log(offer)
    })
})

function iceCandidate(candidate){
    //console.log(candidate);
}

socket.on('sdpAnswer', (answer) => {
    RtcPeer.processAnswer(answer)
    console.log(answer)

    // RtcPeer.send(videostream);
})
