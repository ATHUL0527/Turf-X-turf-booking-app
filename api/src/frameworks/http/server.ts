import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan';
import rateLimit from 'express-rate-limit'
import  express ,{Application,Request,Response,NextFunction} from 'express'
import { AuthRoutes } from '../routes/auth/auth.route';

import { config } from '../../shared/config';
import { PrivateRoutes } from '../routes/privateRoute.ts/privateRoute';

export class Server{
    private _app:Application;
    constructor(){
        this._app=express();
        this.configureMiddlewares();
        this.configureRoutes();
        this.configureErrorHandling();
    }
    private configureRoutes():void{
        this._app.use('/api/v_1/auth',new AuthRoutes().router);
        this._app.use('/api/v_1/pvt',new PrivateRoutes().router);
    }


    private configureMiddlewares():void{

        this._app.use(morgan(config.loggerStatus));

        this._app.use(helmet())

        this._app.use(
            cors({
                origin:config.cors.ALLOWED_ORGIN,
                methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
                allowedHeaders:["Authorization","Content-Type"],
                credentials:true,
            })
        );

        this._app.use((req:Request,res:Response,next:NextFunction)=>{
            express.json()(req,res,next)
        })
        
        this._app.use(cookieParser());

        this._app.use(
            rateLimit({
                windowMs:15*60*1000,
                max:1000
            })
        )
    }

    private configureErrorHandling():void{
        this._app.use(
            (err:any,req:Request,res:Response,next:NextFunction)=>{
                const statusCode:number = err.statusCode || 500;
                const message = err.message || "internal server Error";
                res.status(statusCode).json({
                    success:false,
                    statusCode,
                    message
                })
            }
        )
    }
    public getApp():Application{
        return this._app
    }
}  

