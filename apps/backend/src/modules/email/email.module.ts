import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmailService } from "./email.service";

/**
 * SMTP email delivery feature module.
 */
@Module({
	imports: [ConfigModule],
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
