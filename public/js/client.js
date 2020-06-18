const socket=io(':8443', {secure: true});

//const $video1 = document.querySelector('#output');
//const $stopbutton = document.querySelector('#stop');
//const $mirror = document.querySelector('#wstart');

// $stopbutton.setAttribute('disabled', 'disabled')
// $mirror.setAttribute('disabled', 'disabled')

let videostream = null;
let peerInfo = new Array();
let RtcPeer;
let url= new Array();
let count=0;

const $add1 =document.querySelector('#add1');
const $div1 =document.querySelector('#div1');

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

$div1.addEventListener('click',(event) => {
    //console.log('click registered');
    
    itemid = event.target.id;
    // console.log(itemid)
    
    //console.log(itemid);
    
    splitid=itemid.split('-');

    buttonType=splitid[0]
    num=splitid[1]

    console.log(num)
    
    //console.log(splitid[0]);
    
    if(buttonType=='submit'){
        console.log('submit registered');
        let currinput = document.querySelector(`#input-${num}`);
        peerInfo[num].id=num;
        peerInfo[num].url =currinput.value;
        currinput.value="";
    }
    
    else if(buttonType=='stop'){
        console.log('stop registered');
        let curroutput = document.querySelector(`#output-${num}`);
        curroutput.srcObject=null;
        peerInfo[num].rtcPeer.dispose()
        peerInfo[num].rtcPeer = null;
    }
    
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
        // console.log(error)
            socket.emit('sdpOffer',offer,peerInfo[num].url,num);
        // console.log(offer)
        })
    }
})

function iceCandidate(candidate){
    socket.emit('initice', candidate)
}

socket.on('sdpAnswer', (answer, number) => {
    peerInfo[number].rtcPeer.processAnswer(answer)
    console.log("answer")
})

socket.on('finalice', (candidate, number) => {
    peerInfo[number].rtcPeer.addIceCandidate(candidate);
    // console.log('haha' + '\n' + candidate)
    // setTimeout(() => {
    //     RtcPeer.send(videostream);
    // }, 2000);
    })

socket.on('problem', (message)=> {
    console.log(message);
})

// $mirror.addEventListener('click',() => {
//     RtcPeer=kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly({
//         remoteVideo: $video1,
//         onicecandidate : iceCandidate
//     }, function (error) {
//         if (error){
//             console.log(error)
//         }
//         // console.log("dne")
//     }) 

//     RtcPeer.generateOffer((error,offer)=> {
//         // console.log(error)
//         socket.emit('sdpOffer',offer);
//         // console.log(offer)
//     })
// })
