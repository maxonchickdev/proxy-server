import { Module } from "@nestjs/common";
import { ScheduleModule as CoreScheduleModule } from "@nestjs/schedule";

@Module({
	imports: [CoreScheduleModule.forRoot()],
})
export class ScheduleModule {}
