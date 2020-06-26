// Importing required packages

const fs = require('fs');
const path=require('path');
const minimist = require('minimist');
const express = require('express');
const https = require('https');
const socketio = require('socket.io');
const kurento = require('kurento-client');

// Reading key and SSL certificate
const key =fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

// Setting default URLs
const args = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
        ws_uri: 'ws://localhost:8888/kurento'
    }
});

// Setting up the express app
const publicDirPath=path.join(__dirname,'./public');

console.log(args)

const app = express();

app.use(express.static(publicDirPath))

const server = https.createServer({key: key, cert: cert }, app);

const io=socketio(server);

let kurentoClient =null;

let pipe= new Array();

// Fetching the Kurento Client 
getKurentoClient(kurentoClient, (error, client)=> {
    if (error!==null){
        return console.log(error)
    }

    kurentoClient = client;
})

// On Socket.io conenction
io.on('connection', (socket)=> {
    console.log("New web socket");

    let webRtcEndpoint;
    let queue =[];

    // Receiving SDP offer from client-side
    socket.on('sdpOffer', (offer,url, num) => {

        console.log(url);

        // Checking for empty input
        if (!url){
            socket.emit('problem', "First add stream using submit and then press start")
            return
        }
        
        // Pipeline and Element creation, and subsequent connection
        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error){
                return console.log(error);
            }
    
            createMediaElems(pipeline, url, function(error, webRtc, player){
                if (error){
                    socket.emit(problem, error)
                    return console.log(error)
                }
                
                // Checking for already received ICE candidates in 'queue' Array
                if (queue){
                    while (queue.length){
                        let cand = queue.shift();
                        webRtc.addIceCandidate(cand)
                    }
                }
    
                connectMediaElems(webRtc, player, function(error, webRtcalt, playeralt){
                    if (error){
                        socket.emit(problem,error)
                        pipeline.release();
                        return
                    }
                    
                    // ICE candidate reception
                    webRtcalt.on('OnIceCandidate', function(event) {
                        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        socket.emit('finalice', candidate, num)
                    })

                    // Processing SDP offer and returning answer
                    webRtcalt.processOffer(offer, function(error, answer) {
                        if (error){
                            pipeline.release()
                            console.log(error);
                            return
                        }
            
                        socket.emit('sdpAnswer', answer, num)
            
                        webRtcalt.gatherCandidates((error) => {
                            if (error){
                                console.log(error)
                            }
                        })
                        
                    })

                    // Starts playing stream
                    playeralt.play(function (error) {
                        if (error){
                            console.log("Error is" + "\n" + error)
                        }
                    })
    
                    pipe.push({pipeline: pipeline, player: playeralt, webRTC: webRtcalt});
    
                });  
                
            });
                
        });
    });

    // Listens for ICE candidates sent through 'initice'
    socket.on('initice', (cand) => {
        let candidate = kurento.getComplexType('IceCandidate')(cand);

        if (webRtcEndpoint){
            webRtcEndpoint.addIceCandidate(candidate);
        }
        else {
            queue.push(candidate);
        }

    })
})

// Functions with specified purposes

function getKurentoClient(client, callback){
    if (client!==null) {
        return callback("Already exists", null)
    }

    kurento(args.ws_uri, function (error, tempClient) {
        if (error) {
            return callback("Media server error", null)
        }

        return callback(null, tempClient)
        
    });
}

function createMediaElems(pipeline, url, callback){
    // sample stream
    // const url ="rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov"

    pipeline.create('PlayerEndpoint', {uri : url}, function (error, player) {
        if (error) {
            pipeline.release()
            return callback(error);
        }
    

        pipeline.create('WebRtcEndpoint', (error,webRtc) => {
            if (error){
                pipeline.release();
                return callback(error);
            }

        
            return callback(null, webRtc, player)
        })   
        
    })
}

function connectMediaElems(webRtc, player, callback){
    player.connect(webRtc, function(error){
        if (error){
            return callback(error);
        }
        return callback(null, webRtc, player)
    });
}

// Listening at :8443
server.listen(8443, () => {
    console.log('listening on 8443'); 
});