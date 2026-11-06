import assert from "node:assert/strict";
import { test, after } from "node:test";
import { prisma, JobPostRepository, SubstitutePostRepository, OrganizationRepository, SourcePostRepository } from "../dist/index.js";

after(() => prisma.$disconnect());

function stub(t, target, name, implementation) {
  const original = target[name];
  const mocked = t.mock.fn(implementation);
  target[name] = mocked;
  t.after(() => { target[name] = original; });
  return mocked;
}

for (const [modelName, Repository] of [["jobPost", JobPostRepository], ["substitutePost", SubstitutePostRepository]]) {
  test(`${modelName}: public reads always require a visible post`, async (t) => {
    const repository = new Repository();
    assert.equal(repository.buildWhere(null).hiddenAt, null);
    const list = stub(t, prisma[modelName], "findMany", async () => []);
    const count = stub(t, prisma[modelName], "count", async () => 0);
    const detail = stub(t, prisma[modelName], "findUnique", async () => null);
    // Even a caller-supplied filter cannot opt into hidden posts.
    const unsafeFilter = { hiddenAt: { not: null } };
    await repository.findMany(unsafeFilter, 0, 10);
    await repository.count(unsafeFilter);
    assert.deepEqual(list.mock.calls[0].arguments[0].where, { AND: [unsafeFilter, { hiddenAt: null }] });
    assert.deepEqual(count.mock.calls[0].arguments[0].where, { AND: [unsafeFilter, { hiddenAt: null }] });
    assert.equal(await repository.findById("hidden"), null);
    assert.deepEqual(detail.mock.calls[0].arguments[0].where, { id: "hidden", hiddenAt: null });
  });
}

test("source links, region counts and organization posts exclude hidden jobs", async (t) => {
  const links = stub(t, prisma.jobPostSource, "findMany", async () => []);
  const regions = stub(t, prisma.jobPost, "groupBy", async () => []);
  const org = stub(t, prisma.organization, "findUnique", async () => null);
  const repository = new JobPostRepository();
  await repository.findSources("hidden");
  await repository.groupRegions();
  await new OrganizationRepository().findById("academy");
  assert.equal(links.mock.calls[0].arguments[0].where.jobPost.hiddenAt, null);
  assert.equal(regions.mock.calls[0].arguments[0].where.hiddenAt, null);
  assert.equal(org.mock.calls[0].arguments[0].include.jobPosts.where.hiddenAt, null);
});

test("substitute reimport and lifecycle updates leave moderation fields untouched", async (t) => {
  stub(t, prisma.substitutePost, "findUnique", async () => ({ id: "hidden" }));
  const upsert = stub(t, prisma.substitutePost, "upsert", async () => ({ id: "hidden", hiddenAt: new Date() }));
  const update = stub(t, prisma.substitutePost, "update", async () => ({}));
  const repository = new SubstitutePostRepository();
  await repository.upsert({ source: "balletmania", sourcePostId: "123", hiddenAt: null, hiddenReason: null });
  await repository.updateStatus("hidden", "OPEN");
  for (const data of [upsert.mock.calls[0].arguments[0].update, update.mock.calls[0].arguments[0].data]) {
    assert.equal(Object.hasOwn(data, "hiddenAt"), false);
    assert.equal(Object.hasOwn(data, "hiddenReason"), false);
  }
});

test("job reimport cannot overwrite moderation fields from normalized input", async (t) => {
  const updates = [];
  const tx = {
    sourcePost: { upsert: async () => ({ id: "source" }) },
    jobPostSource: {
      findFirst: async () => ({ jobPostId: "hidden", jobPost: { organizationId: null } }),
      upsert: async () => ({}),
    },
    jobPost: { update: async ({ data }) => { updates.push(data); return { id: "hidden" }; } },
  };
  stub(t, prisma, "$transaction", async (callback) => callback(tx));
  await new SourcePostRepository().importClassifiedItem({
    source: "balletmania", sourcePostId: "123", url: "https://example.test", collectedAt: new Date().toISOString(), raw: {}, classification: {},
    normalized: { title: "test", postedAt: null, contentHash: "hash", sourceConfidence: null, jobPostData: { title: "updated", hiddenAt: null, hiddenReason: null } },
  });
  assert.equal(updates[0].title, "updated");
  assert.equal(Object.hasOwn(updates[0], "hiddenAt"), false);
  assert.equal(Object.hasOwn(updates[0], "hiddenReason"), false);
});
