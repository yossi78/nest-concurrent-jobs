import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({
    description: 'Name of the job',
    example: 'my-task-42',
  })
  @IsString()
  @IsNotEmpty()
  jobName: string;

  @ApiProperty({
    description: 'Array of arguments to pass to the job',
    example: ['arg1', 'arg2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(0)
  arguments: string[];
} 