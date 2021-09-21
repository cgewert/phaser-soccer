//import * as http from 'http';
//import * as ws from 'websocket';
import * as Colyseus from 'colyseus.js'
//import { Server, RedisPresence } from 'colyseus';
//import { createServer } from "http";

export class SoccerServer{
    public readonly PORT = 8888;
    //private wsServer: ws.server | null = null;
    //private server: any = null;
    private server: any = null;
    private client: any = null;

    public constructor(){
        this.client = new Colyseus.Client("ws://localhost:2567");
        
        /*this.server = new Server({
            presence: new RedisPresence(),
        });
        console.log(this.server, createServer);*/
        
        /*this.server = http.createServer((request: any, response: any) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        /*this.server = http.createServer((request, response) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });*/
        /*this.server.listen(this.PORT, () => {
            console.log((new Date()) + ' Server is listening on port 8080');
        });

        this.wsServer = new ws.server({
            httpServer: this.server,
            keepalive: true,
            autoAcceptConnections: false
        });*/
    }

    /*public connect(){
        try {
            const room = await this.client.joinOrCreate("battle", {/* options });
            console.log("joined successfully", room);
        } catch (e) {
            console.error("join error", e);
        }
    } */
}