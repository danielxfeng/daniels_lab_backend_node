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
  }));

  // Mock the refreshToken methods
  sinon.stub(prisma, "refreshToken").get(() => ({
    findUnique: findUniqueMock,
    create: createMock,
    deleteMany: deleteManyMock,
  }));

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
    },

    refreshToken: {
      findUnique: findUniqueMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },

  };
};
