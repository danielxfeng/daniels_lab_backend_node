import sinon from "sinon";
import prisma from "../../src/db/prisma";

export const stubPrisma = () => {
  sinon.restore();

  // Create mock functions that can be chained
  const findManyMock = sinon.stub();
  const countMock = sinon.stub();
  const findUniqueMock = sinon.stub();
  const createMock = sinon.stub();
  const updateManyMock = sinon.stub();
  const deleteManyMock = sinon.stub();

  // Mock the post methods
  sinon.stub(prisma, "post").get(() => ({
    findMany: findManyMock,
    count: countMock,
    findUnique: findUniqueMock,
    create: createMock,
    updateMany: updateManyMock,
    deleteMany: deleteManyMock,
  }));

  // Mock the comment methods
  sinon.stub(prisma, "comment").get(() => ({
    findMany: findManyMock,
    count: countMock,
    findUnique: findUniqueMock,
    create: createMock,
    updateMany: updateManyMock,
    deleteMany: deleteManyMock,
  }));

  return {
    post: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
      create: createMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },

    comment: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
      create: createMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },
  };
};
