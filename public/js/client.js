const socket=io(':8443', {secure: true});

const $video1 = document.querySelector('#output');
const $stopbutton = document.querySelector('#stop');
const $mirror = document.querySelector('#wstart');

// $stopbutton.setAttribute('disabled', 'disabled')
// $mirror.setAttribute('disabled', 'disabled')

let videostream = null;
let RtcPeer;

$stopbutton.addEventListener('click', () => {
    // videostream.getTracks().forEach(function(track) {
    //     track.stop();
    // });
    $video1.srcObject=null;
    RtcPeer.dispose()
    RtcPeer = null;
    //$startbutton.removeAttribute('disabled');
    //$stopbutton.setAttribute('disabled', 'disabled');

})

$mirror.addEventListener('click',() => {
    RtcPeer=kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly({
        remoteVideo: $video1,
        onicecandidate : iceCandidate
    }, function (error) {
        if (error){
            console.log(error)
        }
        // console.log("dne")
    }) 

    RtcPeer.generateOffer((error,offer)=> {
        // console.log(error)
        socket.emit('sdpOffer',offer);
        // console.log(offer)
    })
})

function iceCandidate(candidate){
    socket.emit('initice', candidate)
}

socket.on('sdpAnswer', (answer) => {
    RtcPeer.processAnswer(answer)
    // console.log(answer)
})

socket.on('finalice', (candidate) => {
    RtcPeer.addIceCandidate(candidate);
    // console.log('haha' + '\n' + candidate)
    // setTimeout(() => {
    //     RtcPeer.send(videostream);
    // }, 2000);
})
