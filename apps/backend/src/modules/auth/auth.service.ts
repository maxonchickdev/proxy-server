import {
	ConflictException,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../core/prisma/prisma.service";
import type { AuthResponseType } from "./types/auth-response.type";
import type { JwtPayloadType } from "./types/jwt-payload.type";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { SignInDto } from "./dto/sign-in.dto";

@Injectable()
export class AuthService {
	private readonly saltRounds = 10;

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(JwtService) private readonly jwtService: JwtService,
	) {}

	async signUp(signUpDto: SignUpDto): Promise<AuthResponseType> {
		const existing = await this.prisma.user.findUnique({
			where: { email: signUpDto.email.toLowerCase() },
		});

		if (existing) {
			throw new ConflictException("User with this email already exists");
		}

		const passwordHash = await bcrypt.hash(signUpDto.password, this.saltRounds);

		const user = await this.prisma.user.create({
			data: {
				email: signUpDto.email.toLowerCase(),
				passwordHash,
				name: signUpDto.name ?? null,
			},
		});

		return this.buildAuthResponse(user);
	}

	async signIn(signInDto: SignInDto): Promise<AuthResponseType> {
		const user = await this.prisma.user.findUnique({
			where: { email: signInDto.email.toLowerCase() },
		});

		if (!user) {
			throw new UnauthorizedException("Invalid email or password");
		}

		const valid = await bcrypt.compare(signInDto.password, user.passwordHash);

		if (!valid) {
			throw new UnauthorizedException("Invalid email or password");
		}

		return this.buildAuthResponse(user);
	}

	async validateUserById(userId: string) {
		return this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true },
		});
	}

	private buildAuthResponse(user: {
		id: string;
		email: string;
		name: string | null;
	}): AuthResponseType {
		const payload: JwtPayloadType = { sub: user.id, email: user.email };
		const accessToken = this.jwtService.sign(payload);
		return {
			accessToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		};
	}
}
