import { Module } from "@nestjs/common";
import { PassportModule as CorePassportModule } from "@nestjs/passport";

@Module({
	imports: [CorePassportModule.register({ defaultStrategy: "jwt" })],
})
export class PassportModule {}
