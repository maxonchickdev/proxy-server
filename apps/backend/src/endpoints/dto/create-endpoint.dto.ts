import { IsBoolean, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateEndpointDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;

  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  targetUrl!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
