import sinon from "sinon";
import prisma from "../../src/db/prisma";

export const stubPrisma = () => {
  sinon.restore();

  // Create mock functions that can be chained
  const findManyMock = sinon.stub();
  const countMock = sinon.stub();
  const findUniqueMock = sinon.stub();

  // Mock the post methods
  sinon.stub(prisma, "post").get(() => ({
    findMany: findManyMock,
    count: countMock,
    findUnique: findUniqueMock,
  }));

  return {
    post: {
      findMany: findManyMock,
      count: countMock,
      findUnique: findUniqueMock,
    },
  };
};
