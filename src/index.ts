import * as https from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import qs from 'qs';
import bp from 'body-parser';

class HoverBoard {
    // onboard() 함수 - HoverTheServer 인스턴스를 반환
    static onboard() {
        return new HoverTheServer();
    }
}

type MiddlewareFaster = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
type RideRequest = {};

type RideResultOptions = "file" | "code";
type RideResult = {
    html: (filePath: string, options: { type: RideResultOptions }) => void;
};

interface RideCallBackBody {
    req: RideRequest;
    res: RideResult;
}

class HoverTheServer {
    private routes: { [key: string]: (body: RideCallBackBody) => void } = {};
    private middlewares: (MiddlewareFaster)[] = [];

    // 미들웨어 등록
    faster(middleware: MiddlewareFaster) {
        this.middlewares.push(middleware);
    }

    // fast() 미들웨어 예시
    fast() {
        return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
            console.log("Fast middleware executed");
            next(); // 다음 미들웨어로 넘어감
        };
    }

    // 경로 설정
    ride(pathname: string, callback: (body: RideCallBackBody) => void) {
        this.routes[pathname] = callback;
    }

    // fly 메서드 - 서버 실행
    fly(port: number, callback: () => void) {
        const server = https.createServer((req: IncomingMessage, res: ServerResponse) => {
            const parsedUrl = parse(req.url || '', true);
            const routeHandler = this.routes[parsedUrl.pathname || ''];

            let i = 0;
            const next = () => {
                const middleware = this.middlewares[i++];
                if (middleware) {
                    middleware(req, res, next);
                } else if (routeHandler) {
                    const requestBody: RideRequest = {};
                    const responseBody: RideResult = {
                        html: (pathORcode: string, options: { type: RideResultOptions }) => {
                            if (options.type === 'file') {
                                try {
                                    const fileContent = fs.readFileSync(pathORcode, 'utf-8');
                                    res.writeHead(200, { 'Content-Type': 'text/html' });
                                    res.end(fileContent);
                                } catch (err) {
                                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                                    res.end(err);
                                }
                            }

                            else if (options.type === "code") {
                                try {
                                    res.writeHead(200, { 'Content-Type': 'text/html' });
                                    res.end(pathORcode);
                                } catch (e) {
                                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                                    res.end(e);
                                }
                            }
                        },
                    };

                    // 라우트 핸들러 실행
                    routeHandler({
                        req: requestBody,
                        res: responseBody,
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            };
            next(); // 첫 번째 미들웨어 실행
        });

        server.listen(port, callback);
    }
}
