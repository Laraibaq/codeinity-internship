import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { RegisterPassengerDto } from './dto/register-passenger.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/driver')
  registerDriver(@Body() dto: RegisterDriverDto) {
    return this.auth.registerDriver(dto);
  }

  @Post('register/passenger')
  registerPassenger(@Body() dto: RegisterPassengerDto) {
    return this.auth.registerPassenger(dto);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.auth.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }
}
