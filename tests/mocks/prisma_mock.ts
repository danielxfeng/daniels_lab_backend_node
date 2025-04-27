import sinon from "sinon";
import prisma from "../../src/db/prisma";

export const stubPrisma = () => {
  sinon.restore();

  // Create mock functions that can be chained
  const findManyMock = sinon.stub();
  const countMock = sinon.stub();
  const findUniqueMock = sinon.stub();
  const createMock = sinon.stub();
  const updateMock = sinon.stub();
  const updateManyMock = sinon.stub();
  const deleteManyMock = sinon.stub();
  const findFirstMock = sinon.stub();

  // Mock the post methods
  sinon.stub(prisma, "post").get(() => ({
    findMany: findManyMock,
    count: countMock,
    findUnique: findUniqueMock,
    create: createMock,
    update: updateMock,
    updateMany: updateManyMock,
    deleteMany: deleteManyMock,
  }));

  // Mock the comment methods
  sinon.stub(prisma, "comment").get(() => ({
    findMany: findManyMock,
    count: countMock,
    findUnique: findUniqueMock,
    create: createMock,
    update: updateMock,
    updateMany: updateManyMock,
    deleteMany: deleteManyMock,
  }));

  // Mock the like methods
  sinon.stub(prisma, "like").get(() => ({
    findFirst: findFirstMock,
    count: countMock,
    create: createMock,
    deleteMany: deleteManyMock,
  }));

  // Mock the tag methods
  sinon.stub(prisma, "tag").get(() => ({
    findMany: findManyMock,
  }));

  // Mock the user methods
  sinon.stub(prisma, "user").get(() => ({
    findUnique: findUniqueMock,
    update: updateMock,
    findMany: findManyMock,
    deleteMany: deleteManyMock,
    create: createMock,
    findFirst: findFirstMock,
    updateMany: updateManyMock,
  }));

  // Mock the refreshToken methods
  sinon.stub(prisma, "refreshToken").get(() => ({
    findUnique: findUniqueMock,
    create: createMock,
    deleteMany: deleteManyMock,
  }));

  // Mock the oauthAccount methods
  sinon.stub(prisma, "oauthAccount").get(() => ({
    findUnique: findUniqueMock,
    findFirst: findFirstMock,
    create: createMock,
    deleteMany: deleteManyMock,
  }));

  const tx = {
    user: {
      findUnique: findUniqueMock,
    },
    oauthAccount: {
      findUnique: findUniqueMock,
      deleteMany: deleteManyMock,
      create: createMock,
    },
  };

  const transactionMock = sinon.stub().callsFake(async (fn) => {
    return fn(tx as any);
  });
  prisma.$transaction = transactionMock;

  return {
    post: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },

    comment: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },

    like: {
      findFirst: findFirstMock,
      count: countMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },

    tag: {
      findMany: findManyMock,
    },

    user: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
      update: updateMock,
      deleteMany: deleteManyMock,
      create: createMock,
      findFirst: findFirstMock,
      updateMany: updateManyMock,
    },

    refreshToken: {
      findUnique: findUniqueMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },

    oauthAccount: {
      findUnique: findUniqueMock,
      findFirst: findFirstMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },

    $transaction: transactionMock,
    
    tx,
  }
};
