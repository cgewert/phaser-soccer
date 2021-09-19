const express = require("express")();
const http = require("http").createServer(express);

export class SoccerServer{
    public app = express();
    public server = http.Server(this.app);
    public readonly PORT = 8080;

    public constructor(){
        // Serving the dist folder as http root.
        this.app.use(express.static(__dirname + '/dist'));
        // Serving static files
        this.app.get('/', this.serveStaticFile);
        
        this.server.listen(this.PORT, () => {
          console.log(`Listening on ${this.server.address().port}`);
        });
    }

    private serveStaticFile(req: any, resp: any){
        console.log("GET REQUEST: ", req);
        resp.sendFile(__dirname + '/index.html');
    }
}