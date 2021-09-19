const express = require("express")();
const http = require("http").createServer(express);
//const io = require("socket.io")(http);

export class SoccerServer{
    public readonly PORT = 8081;

    public constructor(){
        // Serving the dist folder as http root.
        http.use(express.static(__dirname + '/dist'));
        // Serving static files
        http.get('/', this.serveStaticFile);
        
        http.listen(this.PORT, () => {
          console.log(`Listening on ${http.address().port}`);
        });
    }

    private serveStaticFile(req: any, resp: any){
        console.log("GET REQUEST: ", req);
        resp.sendFile(__dirname + '/index.html');
    }
}