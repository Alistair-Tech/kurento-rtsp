const fs = require('fs');
const path=require('path');
const minimist = require('minimist');
const express = require('express');
const https = require('https');
const socketio = require('socket.io');
const kurento = require('kurento-client');


const key =fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

const args = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
        ws_uri: 'ws://localhost:8888/kurento'
    }
});

const publicDirPath=path.join(__dirname,'./public');

console.log(args)


const app = express();

app.use(express.static(publicDirPath))

const server = https.createServer({key: key, cert: cert }, app);

const io=socketio(server);

let kurentoClient =null;

getKurentoClient(kurentoClient, (error, client)=> {
    if (error!==null){
        return console.log(error)
    }

    kurentoClient = client;
})

io.on('connection', (socket)=> {
    console.log("New web socket");

    let webRtcEndpoint;
    let queue =[];

    socket.on('sdpOffer', (offer) => {
        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error){
                return console.log(error);
            }
    
            
            createMediaElems(pipeline, function(error, webRtc, player){
                if (error){
                    return console.log(error)
                }
    
                if (queue){
                    while (queue.length){
                        let cand = queue.shift();
                        webRtc.addIceCandidate(cand)
                    }
                }
    
                connectMediaElems(webRtc, player, function(error, webRtcalt, playeralt){
                    if (error){
                        pipeline.release();
                    }
    
                    webRtcalt.on('OnIceCandidate', function(event) {
                        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        socket.emit('finalice', candidate)
                    })

                    webRtcalt.processOffer(offer, function(error, answer) {
                        if (error){
                            pipeline.release()
                            console.log(error);
                        }
            
                        socket.emit('sdpAnswer', answer)
            
                        webRtcalt.gatherCandidates((error) => {
                            if (error){
                                console.log(error)
                            }
                        })
                        
                    })

                    playeralt.play(function (error) {
                        if (error){
                            console.log("Error is" + "\n" + error)
                        }
                    })
    
                    webRtcEndpoint=webRtcalt;
                    pipe = pipeline;
                    playerglobal = playeralt;
    
                })   
                
            });
                
        });

        
    })

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

function createMediaElems(pipeline, callback){
    const url ="rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov"

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

server.listen(8443, () => {
    console.log('listening on 8443'); 
});