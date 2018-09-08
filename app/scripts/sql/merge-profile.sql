--
--  MERGING Profiles with Deputies
--

-- Delete existent profiles
delete from Profiles;

-- Insert matching by email
INSERT IGNORE INTO Profiles (id, displayName, profileNumber, status, party, birth, type, state, district, startDate, building, email, phone, alternate, alternateProfile, studies, academics, hash, slug, createdAt, updatedAt)
select d.id, p.displayName, p.profileNumber, p.status, p.party, p.birth, p.type, p.state, p.district, p.startDate, p.building, p.email, p.phone, p.alternate, p.alternateProfile, p.studies, p.academics, p.hash, p.slug, now() as createdAt, now() as updatedAt
from Deputies d join ProfileStgs p on d.email = p.email order by id;

-- Insert matching by hash
INSERT IGNORE INTO Profiles (id, displayName, profileNumber, status, party, birth, type, state, district, startDate, building, email, phone, alternate, alternateProfile, studies, academics, hash, slug, createdAt, updatedAt)
select d.id, p.displayName, p.profileNumber, p.status, p.party, p.birth, p.type, p.state, p.district, p.startDate, p.building, p.email, p.phone, p.alternate, p.alternateProfile, p.studies, p.academics, p.hash, p.slug, now() as createdAt, now() as updatedAt
from Deputies d join ProfileStgs p on d.hash = p.hash order by id;
