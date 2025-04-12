import { inject, injectable } from "tsyringe";

import { IAuthController } from "../../../entities/controllerInterfaces/auth/IAuthController";

import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../../shared/constants";

import { loginSchema, userSignupSchemas } from "../validations/user-signup.validation.schema";

import { LoginUserDTO, UserDTO } from "../../../shared/dtos/user.dto";

import { handleErrorResponse } from "../../../shared/utils/errorHandler";

import { IRegisterUserUseCase } from "../../../entities/useCaseInterfaces/auth/IRegister-usecase.interface";
import { ILoginUserUseCase } from "../../../entities/useCaseInterfaces/auth/ILoginUserUseCase";
import { IGenerateTokenUseCase } from "../../../entities/useCaseInterfaces/auth/IGenerateTokenUseCase";
import { setAuthCookies } from "../../../shared/utils/cookieHelper";
import { IUserExistenceService } from "../../../entities/services/Iuser-existence-service.interface";
import { IGenerateOtpUseCase } from "../../../entities/useCaseInterfaces/auth/IGenerateOtpUseCase";

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject("IRegisterUserUseCase")
    private registerUserUseCase: IRegisterUserUseCase,
    @inject("ILoginUserUseCase")
    private LoginUserUseCase:ILoginUserUseCase,
    @inject("IGenerateTokenUseCase")
    private GenerateTokenUseCase:IGenerateTokenUseCase,
    @inject("IUserExistenceService")
    private userExistenceService:IUserExistenceService,
    @inject('IGenerateOtpUseCase')
    private generateOtpUseCase:IGenerateOtpUseCase
  ) {}

  //register user
  async register(req: Request, res: Response): Promise<void> {
    console.log("entered",req.body);
    
    try {
      const { role } = req.body as UserDTO;
      console.log(role)
      const schema = userSignupSchemas[role];
      console.log(schema)
      if (!schema) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
        return;
      }
      const validateData = schema.parse(req.body);
      await this.registerUserUseCase.execute(validateData);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      });
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  //login User

 async login(req: Request, res: Response): Promise<void> {
    console.log("entered to login controller");

    try {
      const data = req.body as LoginUserDTO;
      const validateData = loginSchema.parse(data);
      const user = await this.LoginUserUseCase.execute(validateData);
      console.log("user data",user)
      if(!user.id || !user.email || !user.role){
        throw new Error("User ID,Email,or Role is missing")
      }

      const tokens = await this.GenerateTokenUseCase.execute(
        user.id,
        user.email,
        user.role
      );


      const accessTokenName = `${user.role}_access_token`;
      const refreshTokenName = `${user.role}_refresh_token`;

      setAuthCookies(
        res,
      tokens.accessToken,
      tokens.refreshToken,
      accessTokenName,
      refreshTokenName
      )
      console.log(user);
      res.status(HTTP_STATUS.OK).json({
        success:true,
        message:SUCCESS_MESSAGES.LOGIN_SUCCESS,
        user:{
          name: user.name,
          email: user.email,
          role: user.role,
          phone:user.phone,
          profileImage:user.profileImage,
          bio:user.bio,
          joinedAt:user.joinedAt
        }
      })
    } catch (error) {
      console.log(error)
      handleErrorResponse(res,error)
    }
    
  }

  //send Otp Email
  async sendOtpEmail(req:Request,res:Response):Promise<void>{
    
    const {email} = req.body;
    try {
      const existingEmail =  await this.userExistenceService.emailExists(email);
      if(existingEmail){
        res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({message:ERROR_MESSAGES.EMAIL_EXISTS})
      return;
      }

      await this.generateOtpUseCase.execute(email);

      res
      .status(HTTP_STATUS.CREATED)
      .json({message:SUCCESS_MESSAGES.OTP_SEND_SUCCESS})

      
    } catch (error) {
      handleErrorResponse(res,error)
    }
  }
}
