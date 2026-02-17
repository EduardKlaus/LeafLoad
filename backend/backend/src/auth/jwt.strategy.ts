import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export const JWT_SECRET = process.env.JWT_SECRET || 'leafload-dev-secret';

// Payload stored inside the JWT
export interface JwtPayload {
    sub: number;       // userId
    role: string;      // 'CUSTOMER' | 'RESTAURANT_OWNER'
    restaurantId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_SECRET,
        });
    }

    // Passport calls this after successful verification.
    // The returned object is attached to request.user.
    validate(payload: JwtPayload) {
        return {
            userId: payload.sub,
            role: payload.role,
            restaurantId: payload.restaurantId,
        };
    }
}
