import * as https from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import cors from 'cors';
import qs from 'qs';
import bp from 'body-parser';
import { parse } from 'url';

class HoverBoard {
    static onboard() {}
}

type RideRequest = {};
type RideResult = {};

interface RideCallBackBody {
    req: RideRequest;
    res: RideResult
}

class HoverTheServer {
    private routes: { [key: string]: (body: RideCallBackBody) => void } = {};

    ride(pathname: string, callback: (body: RideCallBackBody) => void) {
        this.routes[pathname] = callback;
    }

    fly(port: number, callback: () => void) {
        const server = https.createServer((req: IncomingMessage, res: ServerResponse) => {
            const parsedUrl = parse(req.url || "", true);
            const routeHandler = this.routes[parsedUrl.pathname || ""];

            if (routeHandler) {
                const requsetBody: RideRequest = {};
                const responseBody: RideResult = {};

                routeHandler({
                    req: requsetBody,
                    res: responseBody,
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(responseBody));
            }

            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("Not Found");
            }
        });

        server.listen(port, callback);
    }
}