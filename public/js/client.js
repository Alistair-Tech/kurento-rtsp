const socket=io(':8443', {secure: true});

//const $video1 = document.querySelector('#output');
//const $stopbutton = document.querySelector('#stop');
//const $mirror = document.querySelector('#wstart');

// $stopbutton.setAttribute('disabled', 'disabled')
// $mirror.setAttribute('disabled', 'disabled')

let videostream = null;
let RtcPeer= new Array();
let url= new Array();
let count=0;

const $add1 =document.querySelector('#add1');
const $div1 =document.querySelector('#div1');

$add1.addEventListener('click',() => {
    console.log('new feilds added');
    $div1.insertAdjacentHTML('beforeend',`<video id="output-${count}" autoplay></video><br>
        <input id="input-${count}" type="text" placeholder="input RTSP link">
        <button id="submit-${count}">Submit</button><br><br>
        <button id="start-${count}">Start</button>
        <button id="stop-${count}">Stop</button><br><br>`);
    count++;
    RtcPeer.push(0);
    url.push(0);
})

var itemid,splitid;

$div1.addEventListener('click',(event) => {
    
    //console.log('click registered');
    
    
    itemid = event.target.id;
    
    //console.log(itemid);
    
    splitid=itemid.split('-');
    
    //console.log(splitid[0])
    
    if(splitid[0]=='submit'){
        console.log('submit registered');
        let currinput = document.querySelector(`#input-${splitid[1]}`);
        url[splitid[1]]=currinput.value;
        currinput.value="";
    }
    
    else if(splitid[0]=='stop'){
        console.log('stop registered');
        let curroutput = document.querySelector(`#output-${splitid[1]}`);
        curroutput.srcObject=null;
        RtcPeer[splitid[1]].dispose()
        RtcPeer[splitid[1]] = null;
    }
    
    else if(splitid[0]=='start'){
        console.log('start registered');
        let curroutput = document.querySelector(`#output-${splitid[1]}`);
        console.log(curroutput.id);
        
        RtcPeer[splitid[1]]=kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly({
        remoteVideo: curroutput,
        onicecandidate : iceCandidate
    }, function (error) {
        if (error){
            console.log(error)
        }
        // console.log("dne")
        }) 

    RtcPeer[splitid[1]].generateOffer((error,offer)=> {
        // console.log(error)
        socket.emit('sdpOffer',offer,url[splitid[1]]);
        // console.log(offer)
        })
    }
})

function iceCandidate(candidate){
    socket.emit('initice', candidate)
}

socket.on('sdpAnswer', (answer,urlx) => {
    RtcPeer[splitid[1]].processAnswer(answer)
    console.log("answer")
    //console.log(urlx)
})

socket.on('finalice', (candidate) => {
    RtcPeer[splitid[1]].addIceCandidate(candidate);
    // console.log('haha' + '\n' + candidate)
    // setTimeout(() => {
    //     RtcPeer.send(videostream);
    // }, 2000);
    })


/*
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
*/