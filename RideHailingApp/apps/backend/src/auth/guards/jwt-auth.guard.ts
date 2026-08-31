import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Wraps the 'jwt' passport strategy (JwtStrategy, registered via AuthModule) for use on any
// protected endpoint via @UseGuards(JwtAuthGuard). First real consumer: POST /drivers/me/documents.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
