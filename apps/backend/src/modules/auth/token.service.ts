import type { CurrentUserPayload } from "../../common/types/current-user-payload.type";
import type { JwtType } from "../../core/config/types/jwt.type";
import type { AuthResponseType } from "./types/auth-response.type";
import type { JwtPayloadType } from "./types/jwt-payload.type";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { nanoid } from "nanoid";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { PrismaService } from "../../core/prisma/prisma.service";
import { parseDurationToMs } from "./utils/duration.util";
import { hashOpaqueToken } from "./utils/token-hash.util";

const REFRESH_TOKEN_NANOID_LENGTH = 64;

@Injectable()
export class TokenService {
	private readonly refreshExpiresIn: string;

	constructor(
		@Inject(PrismaService) private readonly prismaService: PrismaService,
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(ConfigService) readonly configService: ConfigService,
	) {
		const { refreshExpiresIn } = configService.getOrThrow<JwtType>(
			ConfigKeyEnum.JWT,
		);

		this.refreshExpiresIn = refreshExpiresIn;
	}

	private get refreshExpiresMs(): number {
		return parseDurationToMs(this.refreshExpiresIn);
	}

	async validateRefreshToken(rawToken: string): Promise<{
		tokenId: string;
		user: CurrentUserPayload;
	}> {
		const tokenHash = hashOpaqueToken(rawToken);
		const row = await this.prismaService.refreshToken.findUnique({
			where: { tokenHash },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						isEmailVerified: true,
					},
				},
			},
		});
		if (
			!row ||
			row.isRevoked ||
			row.expiresAt < new Date() ||
			!row.user.isEmailVerified
		) {
			throw new UnauthorizedException("Invalid or expired session");
		}
		return {
			tokenId: row.id,
			user: {
				id: row.user.id,
				email: row.user.email,
				name: row.user.name,
			},
		};
	}

	async rotateRefreshToken(
		rawToken: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const { tokenId, user } = await this.validateRefreshToken(rawToken);
		await this.prismaService.refreshToken.update({
			where: { id: tokenId },
			data: { isRevoked: true },
		});
		return this.issueTokensForUser(user);
	}

	async logout(rawToken: string | undefined): Promise<void> {
		if (!rawToken) return;
		const tokenHash = hashOpaqueToken(rawToken);
		await this.prismaService.refreshToken.updateMany({
			where: { tokenHash, isRevoked: false },
			data: { isRevoked: true },
		});
	}

	async issueTokensForUserId(
		userId: string,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true },
		});
		if (!user) {
			throw new UnauthorizedException();
		}
		return this.issueTokensForUser(user);
	}

	private async issueTokensForUser(
		user: CurrentUserPayload,
	): Promise<AuthResponseType & { refreshToken: string }> {
		const payload: JwtPayloadType = { sub: user.id, email: user.email };
		const accessToken = this.jwtService.sign(payload);
		const rawRefresh = nanoid(REFRESH_TOKEN_NANOID_LENGTH);
		const tokenHash = hashOpaqueToken(rawRefresh);
		const expiresAt = new Date(Date.now() + this.refreshExpiresMs);
		await this.prismaService.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash,
				expiresAt,
			},
		});
		return {
			accessToken,
			refreshToken: rawRefresh,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		};
	}
}
