import * as http from 'http';
import * as ws from 'websocket';

export class SoccerServer{
    public readonly PORT = 8888;
    private wsServer: ws.server | null = null;
    private server: any = null;

    public constructor(){
        this.server = http.createServer((request: any, response: any) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        /*this.server = http.createServer((request, response) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });*/
        this.server.listen(this.PORT, () => {
            console.log((new Date()) + ' Server is listening on port 8080');
        });

        this.wsServer = new ws.server({
            httpServer: this.server,
            keepalive: true,
            autoAcceptConnections: false
        });
    }
}