import { Test, TestingModule } from '@nestjs/testing';
import { getMongoToken, InjectMongo, MongoModule } from './mongo.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';

@Injectable()
class DefaultProvider {
    constructor(@InjectMongo() public readonly mongoClient: MongoClient) {}
}

@Injectable()
class CustomProvider {
    constructor(@InjectMongo('foo') public readonly mongoClient: MongoClient) {}
}

describe('Mongo module', () => {
    let mongodb: MongoMemoryServer;

    beforeAll(async () => {
        mongodb = await MongoMemoryServer.create({});
    });

    afterAll(async () => {
        await mongodb.stop();
    });

    describe('forRoot', () => {
        describe('default connection name', () => {
            let module: TestingModule;

            beforeAll(async () => {
                module = await Test.createTestingModule({
                    providers: [DefaultProvider],
                    imports: [
                        MongoModule.forRoot({
                            uri: mongodb.getUri(),
                        }),
                    ],
                }).compile();
            });

            afterAll(async () => {
                await module.close();
            });

            it('should create a mongo client provider', async () => {
                const mongoClient = await module.resolve(getMongoToken());
                expect(mongoClient).toBeDefined();
            });

            it('should inject the mongo client', async () => {
                const fooProvider = await module.resolve(DefaultProvider);
                expect(fooProvider.mongoClient).toBeDefined();
            });
        });

        describe('custom connection name', () => {
            let module: TestingModule;
            beforeAll(async () => {
                module = await Test.createTestingModule({
                    providers: [CustomProvider],
                    imports: [
                        MongoModule.forRoot({
                            uri: mongodb.getUri(),
                            mongoName: 'foo',
                        }),
                    ],
                }).compile();
            });

            afterAll(async () => {
                await module.close();
            });

            it('should create a mongo client provider', async () => {
                const mongoClient = await module.resolve(getMongoToken('foo'));
                expect(mongoClient).toBeDefined();
            });

            it('should inject the mongo client', async () => {
                const fooProvider = await module.resolve(CustomProvider);
                expect(fooProvider.mongoClient).toBeDefined();
            });
        });
    });

    describe('forRootAsync', () => {
        describe('default connection name', () => {
            let module: TestingModule;

            beforeAll(async () => {
                module = await Test.createTestingModule({
                    providers: [DefaultProvider],
                    imports: [
                        MongoModule.forRootAsync({
                            useFactory: async () => ({
                                uri: mongodb.getUri(),
                            }),
                        }),
                    ],
                }).compile();
            });

            afterAll(async () => {
                await module.close();
            });

            it('should create a mongo client provider', async () => {
                const mongoClient = await module.resolve(getMongoToken());
                expect(mongoClient).toBeDefined();
            });

            it('should inject the mongo client', async () => {
                const fooProvider = await module.resolve(DefaultProvider);
                expect(fooProvider.mongoClient).toBeDefined();
            });
        });

        describe('custom connection name', () => {
            let module: TestingModule;

            beforeAll(async () => {
                module = await Test.createTestingModule({
                    providers: [CustomProvider],
                    imports: [
                        MongoModule.forRootAsync(
                            {
                                useFactory: async () => ({
                                    uri: mongodb.getUri(),
                                }),
                            },
                            'foo',
                        ),
                    ],
                }).compile();
            });

            afterAll(async () => {
                await module.close();
            });

            it('should create a mongo client provider', async () => {
                const mongoClient = await module.resolve(getMongoToken('foo'));
                expect(mongoClient).toBeDefined();
            });

            it('should inject the mongo client', async () => {
                const fooProvider = await module.resolve(CustomProvider);
                expect(fooProvider.mongoClient).toBeDefined();
            });
        });

        describe('connection fails', () => {
            it('should create a null mongo client provider instead of throwing exception when throwOnConnectionFailure parameter is false', async () => {
                const module = await Test.createTestingModule({
                    providers: [CustomProvider],
                    imports: [
                        MongoModule.forRootAsync(
                            {
                                useFactory: async () => ({
                                    uri: 'mongodb://net_exists',
                                    mongoOptions: {
                                        serverSelectionTimeoutMS: 100,
                                    },
                                }),
                            },
                            'foo',
                            false,
                        ),
                    ],
                }).compile();

                const mongoClient = await module.resolve(getMongoToken('foo'));
                expect(mongoClient).toBeNull();
            });

            it('should throw when connection fails and throwOnConnectionFailure parameter is not false', async () => {
                const testingModuleBuilder = Test.createTestingModule({
                    providers: [CustomProvider],
                    imports: [
                        MongoModule.forRootAsync(
                            {
                                useFactory: async () => ({
                                    uri: 'mongodb://net_exists',
                                    mongoOptions: {
                                        serverSelectionTimeoutMS: 100,
                                    },
                                }),
                            },
                            'foo',
                        ),
                    ],
                });

                await expect(async () => await testingModuleBuilder.compile()).rejects.toThrow();
            });
        });
    });
});
