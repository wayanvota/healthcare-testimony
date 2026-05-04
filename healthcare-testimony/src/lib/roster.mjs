import { COMMITTEES, getCommittee } from "./committees.mjs";
import { SAMPLE_MEMBERSHIPS, SAMPLE_SENATORS, SAMPLE_SUBCOMMITTEES } from "./fixtures.mjs";
import { parseList, unique } from "./utils.mjs";

export function getRoster({ committeeCode, includeSenators = [], excludeSenators = [] } = {}) {
  const include = parseList(includeSenators).map((name) => name.toLowerCase());
  const exclude = parseList(excludeSenators).map((name) => name.toLowerCase());
  const memberships = SAMPLE_MEMBERSHIPS.filter((membership) => !committeeCode || membership.committeeCode === committeeCode);
  const senators = memberships
    .map((membership) => senatorWithMembership(membership))
    .filter(Boolean)
    .filter((senator) => !include.length || include.some((item) => senator.fullName.toLowerCase().includes(item)))
    .filter((senator) => !exclude.some((item) => senator.fullName.toLowerCase().includes(item)));

  return {
    committee: committeeCode ? getCommittee(committeeCode) : null,
    source: "local_fixture",
    refreshed: false,
    senators
  };
}

export function getRelevantSenators(committeeCodes, options = {}) {
  const selected = unique(committeeCodes).filter((code) => COMMITTEES[code]);
  const byId = new Map();
  for (const code of selected) {
    for (const senator of getRoster({ committeeCode: code, ...options }).senators) {
      const existing = byId.get(senator.id);
      if (!existing) byId.set(senator.id, senator);
      else {
        existing.memberships.push(...senator.memberships);
        existing.committeeCodes = unique([...existing.committeeCodes, ...senator.committeeCodes]);
        existing.committeeRoles = unique([...existing.committeeRoles, ...senator.committeeRoles]);
      }
    }
  }
  return [...byId.values()];
}

function senatorWithMembership(membership) {
  const senator = SAMPLE_SENATORS.find((item) => item.id === membership.senatorId);
  if (!senator) return null;
  const committee = getCommittee(membership.committeeCode);
  const subcommittees = SAMPLE_SUBCOMMITTEES.filter((item) => item.senatorId === senator.id && item.committeeCode === membership.committeeCode);
  return {
    ...senator,
    memberships: [{ ...membership, committeeName: committee?.name || membership.committeeCode }],
    committeeCodes: [membership.committeeCode],
    committeeRoles: [`${committee?.shortName || membership.committeeCode}: ${membership.role}`],
    subcommittees
  };
}
