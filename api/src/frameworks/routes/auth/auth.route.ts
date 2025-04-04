import {Request,Response} from 'express';
import {BaseRoute} from '../baseRoute';
import { authController } from '../../di/resolver';


export  class AuthRoutes extends BaseRoute{
    constructor(){
        super()
    }
    protected initializeRoutes(): void {
        this.router.post("/signup",(req:Request,res:Response)=>{
            authController.register(req,res)
        })
    }
}