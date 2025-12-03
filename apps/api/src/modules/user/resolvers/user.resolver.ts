import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class RootResolver {
  @Query(() => String, {
    name: 'hello',
    description: 'A simple hello world query',
  })
  hello(): string {
    return 'Hello World!';
  }

  @Query(() => String, {
    name: 'health',
    description: 'Health check endpoint',
  })
  health(): string {
    return 'OK';
  }
}
