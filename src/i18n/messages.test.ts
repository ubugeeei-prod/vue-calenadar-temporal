import { describe, expect, it } from "vitest";
import { englishMessages, mergeMessages } from "./messages";

describe("mergeMessages", () => {
  it("returns English defaults when no overrides are given", () => {
    expect(mergeMessages()).toBe(englishMessages);
    expect(englishMessages.previous("month")).toBe("Previous month");
    expect(englishMessages.next("year")).toBe("Next year");
    expect(englishMessages.moreEvents(3)).toBe("+3 more");
  });

  it("merges partial overrides over the defaults", () => {
    const messages = mergeMessages({
      today: "今日",
      moreEvents: (count) => `他${count}件`,
    });
    expect(messages.today).toBe("今日");
    expect(messages.moreEvents(2)).toBe("他2件");
    expect(messages.close).toBe("Close");
    expect(messages.weekNumber(29)).toBe("Week 29");
  });
});
