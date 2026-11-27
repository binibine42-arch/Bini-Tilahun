import React from 'react';
import { Globe, Maximize2, Users } from 'lucide-react';
import {
  DESIGNER_PROFILE,
  GROUP_MEMBERS,
  GroupMember,
} from '../data/portfolioData';

interface GroupTeamSectionProps {
  onInspectMember: (member: GroupMember) => void;
}

export const GroupTeamSection: React.FC<GroupTeamSectionProps> = ({
  onInspectMember,
}) => {
  return (
    <section
      id="group"
      aria-label="Negen Digital Creative Group"
      className="scroll-mt-20 border-t border-white/10 py-14"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-400">
            Creative Collective
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
            {DESIGNER_PROFILE.groupName} Group Profiles
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Working together as a creative group under{' '}
            <span className="font-medium text-white">
              {DESIGNER_PROFILE.groupName}
            </span>{' '}
            to deliver cohesive brand systems, typography, and digital design.
          </p>
        </div>

        <a
          href={DESIGNER_PROFILE.groupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 whitespace-nowrap shrink-0 sm:self-auto"
        >
          <Globe className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span>Visit {DESIGNER_PROFILE.groupName} →</span>
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {GROUP_MEMBERS.map((member) => (
          <article
            key={member.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-amber-400/20 bg-[#111116]/90 shadow-xl backdrop-blur-sm transition-colors duration-200 hover:border-amber-400/45"
          >
            <button
              type="button"
              onClick={() => onInspectMember(member)}
              aria-label={`Inspect ${member.name} profile portrait`}
              className={`relative flex h-[340px] w-full items-center justify-center overflow-hidden border-b border-white/10 p-4 sm:h-[380px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                member.isWhiteBackdrop ? 'bg-white' : 'bg-[#18171D]'
              }`}
            >
              <img
                src={member.image}
                alt={`${member.name} — ${member.role}`}
                loading="lazy"
                decoding="async"
                className={`max-h-full max-w-full rounded-md transition-transform duration-300 group-hover:scale-[1.02] ${
                  member.isWhiteBackdrop
                    ? 'object-contain'
                    : 'h-full w-full object-contain'
                }`}
              />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-sm transition-colors group-hover:border-amber-400/50 group-hover:text-amber-200">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Full View</span>
              </span>
            </button>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-amber-400">
                    {member.role}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{DESIGNER_PROFILE.groupName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{member.location}</span>
                </div>

                <h3 className="mt-2 font-display text-2xl font-bold text-white">
                  {member.name}
                </h3>

                {member.tagline && (
                  <p className="mt-1 text-xs font-medium text-amber-200/85">
                    “{member.tagline}”
                  </p>
                )}

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {member.bio}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                  <Users
                    className="h-3.5 w-3.5 text-amber-400"
                    aria-hidden="true"
                  />
                  <span>Group Collaboration Profile</span>
                </span>

                <button
                  type="button"
                  onClick={() => onInspectMember(member)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  Inspect Portrait →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
