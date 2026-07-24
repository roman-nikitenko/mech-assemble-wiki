--
-- PostgreSQL database dump
--

\restrict yyjgjtXxt7F3yqH3CNuKyN7OaFxYNUnCzLmJ2jXSCW7Ev5p5bcfmtKutYqWbhuN

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BuildStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BuildStatus" AS ENUM (
    'Draft',
    'Published',
    'Unposted'
);


--
-- Name: MechRank; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MechRank" AS ENUM (
    'Standard',
    'S'
);


--
-- Name: SkillNodeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SkillNodeType" AS ENUM (
    'Normal',
    'Premium',
    'Core'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accessories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessories (
    id uuid NOT NULL,
    mech_id uuid,
    name text NOT NULL,
    exclusive_effect text,
    tier public."MechRank" DEFAULT 'Standard'::public."MechRank" NOT NULL,
    attributes jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_url text,
    icon_url text
);


--
-- Name: awakening_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.awakening_levels (
    id uuid NOT NULL,
    mech_id uuid NOT NULL,
    level integer NOT NULL,
    stat_bonus jsonb,
    special_effect text,
    requirement text
);


--
-- Name: awakening_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.awakening_nodes (
    id uuid NOT NULL,
    level_id uuid NOT NULL,
    "position" integer NOT NULL,
    attribute text NOT NULL
);


--
-- Name: awakening_unlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.awakening_unlocks (
    id uuid NOT NULL,
    level_id uuid NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: build_hearts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_hearts (
    build_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: builds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.builds (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "mechId" text,
    weapon_id text,
    skill_ids text[],
    weapon_ids text[],
    weapon_skill_ids jsonb DEFAULT '{}'::jsonb NOT NULL,
    hearts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    status public."BuildStatus" DEFAULT 'Draft'::public."BuildStatus" NOT NULL
);


--
-- Name: helper_ranks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helper_ranks (
    id uuid NOT NULL,
    helper_id uuid NOT NULL,
    rank integer NOT NULL,
    effect text NOT NULL
);


--
-- Name: helpers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helpers (
    id uuid NOT NULL,
    mech_id uuid,
    weapon_id uuid,
    name text NOT NULL,
    passive_effect text
);


--
-- Name: mech_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mech_skills (
    id uuid NOT NULL,
    mech_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    base_stats jsonb
);


--
-- Name: mech_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mech_traits (
    id uuid NOT NULL,
    mech_id uuid NOT NULL,
    trait_id uuid NOT NULL
);


--
-- Name: mechs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechs (
    id uuid NOT NULL,
    name text NOT NULL,
    epithet text,
    rank public."MechRank" NOT NULL,
    special_bonus text,
    lore text,
    image_url text,
    type_id uuid,
    icon_url text,
    rank_up_preview text[],
    card_skill_icon_url text
);


--
-- Name: pilots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pilots (
    id uuid NOT NULL,
    name text NOT NULL,
    unlock_boost text,
    relationship_bonus text,
    bonus_per_level text[],
    icon_url text,
    background_url text,
    mech_id uuid,
    weapon_id uuid
);


--
-- Name: skill_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_nodes (
    id uuid NOT NULL,
    weapon_id uuid,
    parent_id uuid,
    name text,
    description text,
    appearance_level integer DEFAULT 1 NOT NULL,
    type public."SkillNodeType" DEFAULT 'Normal'::public."SkillNodeType" NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    mech_id uuid,
    repeatable boolean DEFAULT false NOT NULL
);


--
-- Name: skill_upgrades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_upgrades (
    id uuid NOT NULL,
    skill_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    description text,
    is_evolution boolean DEFAULT false NOT NULL,
    unlock_req text
);


--
-- Name: skin_stars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skin_stars (
    id uuid NOT NULL,
    skin_id uuid NOT NULL,
    star integer NOT NULL,
    perk text NOT NULL
);


--
-- Name: skins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skins (
    id uuid NOT NULL,
    mech_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    image_url text
);


--
-- Name: traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.traits (
    id uuid NOT NULL,
    name text NOT NULL,
    color text
);


--
-- Name: types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types (
    id uuid NOT NULL,
    name text NOT NULL,
    icon_url text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    auth0_sub text NOT NULL,
    nickname text,
    server text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name text
);


--
-- Name: weapon_skins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapon_skins (
    id uuid NOT NULL,
    weapon_id uuid NOT NULL,
    name text NOT NULL,
    bonuses text[],
    image_url text
);


--
-- Name: weapon_upgrades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapon_upgrades (
    id uuid NOT NULL,
    weapon_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    description text,
    is_evolution boolean DEFAULT false NOT NULL,
    unlock_req text
);


--
-- Name: weapons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapons (
    id uuid NOT NULL,
    mech_id uuid,
    name text NOT NULL,
    description text,
    base_stats jsonb,
    type_id uuid,
    tier public."MechRank" DEFAULT 'Standard'::public."MechRank" NOT NULL,
    rank_up_preview text[],
    image_url text,
    icon_url text
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5b58e0da-2cfe-46f8-bfd2-bafb81f4dbd7	c3effeb32405785f7d24bfbc764fe4c4bfe4dd62d8dad1928eb807dcc01b2e47	2026-07-07 13:27:49.374886+03	20260707102749_init	\N	\N	2026-07-07 13:27:49.360446+03	1
d63950f4-3413-4be6-ab6c-c4c510634b38	c79f9fd564060a4b3ca3b2800eb7dc88f07bf5559b14da5e01685808de22d3cf	2026-07-15 21:25:13.124951+03	20260715182513_add_mech_rank_up_preview	\N	\N	2026-07-15 21:25:13.123945+03	1
50088c4d-8b98-4db2-9d27-faf316346530	3085f4ec6bdd0d1ce68bff81c9aeb64efc9912a718823556085493fb884602e3	2026-07-08 15:26:19.750062+03	20260708122619_add_mech_image	\N	\N	2026-07-08 15:26:19.749064+03	1
163ece09-f1d7-479a-a544-09958f7fb088	3eb0ea763f738441bcd5f4ecfcd7aaf669b577df69ff4260bc7352ed6abe2cbb	2026-07-09 12:05:11.148371+03	20260709090511_add_pilots	\N	\N	2026-07-09 12:05:11.141767+03	1
f3466120-a494-4a4a-9352-3ed2ed2e5514	503fce40edcdf344116799cba73fc6e427d0ae041f4328ddeb2ba60661c079dc	2026-07-09 17:54:35.21647+03	20260709110000_types_as_table	\N	\N	2026-07-09 17:54:35.209953+03	1
58402d7c-7d0c-457c-93df-f02407b82d89	1884cb50aa67822fab08a715e6f595fbc86826d4542d6808aa6f2bf5dc2e1e5c	2026-07-15 22:08:07.801977+03	20260715190807_add_skin_image	\N	\N	2026-07-15 22:08:07.800998+03	1
3fdde212-fb9c-4e28-8839-5e5fa89a6830	36114cf69866cb66fa0e5fa495050ac46ab066b4208be4c2a187fb9797de75c5	2026-07-09 21:36:58.837783+03	20260709120000_weapons_standalone	\N	\N	2026-07-09 21:36:58.826972+03	1
7d2594b3-ca52-47f4-8213-dbbe08e03413	5225d6f0920f5b333d02678a2a2732deee2b6a6b396737f843382893073ee569	2026-07-10 15:36:42.634609+03	20260710123642_add_weapon_icon	\N	\N	2026-07-10 15:36:42.633867+03	1
77d0bfd9-d2b4-4894-9b87-6848111f76b8	55567d553a5a8fc1445c4b34d4f9ead9a6f63a711c187a9f91e1d2dca50dfab6	2026-07-10 23:36:50.784745+03	20260710203650_add_weapon_skin_image	\N	\N	2026-07-10 23:36:50.783697+03	1
d8e3a0e2-2094-4c85-b584-1d808c613054	f59e9845966057bdda516fb77a74e025a76005ec2443978e8af669615cb97d34	2026-07-16 15:00:22.560792+03	20260716120022_add_mech_card_skill_icon	\N	\N	2026-07-16 15:00:22.559695+03	1
e830bbc2-c13c-466a-919a-e2b3a88e09de	67e731f368b6abadb9b64b687e2027d333c540685895dad2414bacfd87fec08c	2026-07-11 17:57:27.124291+03	20260711180000_accessories_standalone	\N	\N	2026-07-11 17:57:27.114113+03	1
745f0d0f-8302-4431-bb1d-d11ce01aee9a	f4a9ed6da7c0ea5c85306228d7d41b2ac4836ea523ea37fa640c61078bc19499	2026-07-13 18:16:45.607501+03	20260713151645_add_accessory_icon	\N	\N	2026-07-13 18:16:45.606571+03	1
4e633e53-9d20-4e77-aaed-2b22b40dbb83	964d1c4e799a13c2b70d0e97a35077fbe0dcbc9bbfe4b5efa079a6646e94ad45	2026-07-14 14:38:58.980779+03	20260714113858_add_skill_nodes	\N	\N	2026-07-14 14:38:58.973902+03	1
fdab0d83-8a22-49f9-8a81-ce883ecbaffa	5459f4293737b6f34c36d6c781f6d26a5a7448bf50c1a130b8460cacd49898be	2026-07-19 13:09:57.418246+03	20260719100957_add_users	\N	\N	2026-07-19 13:09:57.412483+03	1
fc00ff7a-fe68-4ab4-9775-0af7ac1822d0	5ec77cb055a9f0134c5138434ad5cf7ba3b13ab4d422ba9d0a085ced36e73b4a	2026-07-14 21:40:29.489028+03	20260714184029_skill_nodes_dual_owner	\N	\N	2026-07-14 21:40:29.486481+03	1
564ce1c2-8428-48f4-8289-5937d5a53a87	6450ea835c0cd55491df0084f282b1f67d6480c567105340542f39a927e94890	2026-07-15 20:11:14.059701+03	20260715171114_add_mech_icon	\N	\N	2026-07-15 20:11:14.058404+03	1
1642548e-1d8c-4bb2-9643-78a28f48e52f	d1a013c561f2c7880a9950fa8f3d1bdd0772b1d3e554702b84ef8a9ff1d49dca	2026-07-15 20:38:46.280767+03	20260715203831_drop_mech_quality_and_pilot_name	\N	\N	2026-07-15 20:38:46.276986+03	1
0167daa3-4267-4fe4-b857-caeede294597	fc62e3885cd309f6c80c9cfdf6c6573fcf05e44d1f7d73daf60a1a1bcf5a1fca	2026-07-20 14:16:45.04419+03	20260720111645_add_builds_table	\N	\N	2026-07-20 14:16:45.037711+03	1
b3d5c80e-1896-4161-b8bc-2b452247dc55	ae937c53347ab446090f6a2871452ac216f828b1e417ffa29540bce11c842975	2026-07-20 14:34:32.911469+03	20260720113432_add_build_hearts	\N	\N	2026-07-20 14:34:32.907749+03	1
4f972728-fbeb-4674-a4bd-49d8a54f674c	403178389bc9b8fc743e6cf2e973e1858cd3340b8164f20d2380982e57f885fc	2026-07-20 19:54:23.964007+03	20260720165412_add_build_status	\N	\N	2026-07-20 19:54:23.961594+03	1
146327fa-d747-4433-bc13-5728c5926f25	ebf45d44aec32fa6a631b28c62699f5bb31858aecd3a3d4875a042319f330ca8	2026-07-20 20:28:49.911768+03	20260720172849_add_user_name	\N	\N	2026-07-20 20:28:49.910947+03	1
0fede37d-6562-427e-a206-c205f00d7ae0	4215027e3fa73ee870166168b0e9c63b0c2a6ce2ca13186433e0ec91b6a091ab	2026-07-20 21:09:27.526843+03	20260720180927_add_skill_node_repeatable	\N	\N	2026-07-20 21:09:27.524873+03	1
\.


--
-- Data for Name: accessories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessories (id, mech_id, name, exclusive_effect, tier, attributes, image_url, icon_url) FROM stdin;
b2f5a0dd-718e-4387-8a27-26af1ed27598	dd80f22d-8562-4920-99d0-f6f858347960	Shadow Mask	In guild battle, the spiral sword is released very 10 second	S	[{"name": "HP", "value": "10%"}, {"name": "HP", "value": "32.00k"}]	/uploads/ebdbbf94-c8f1-45d3-9f3f-56eca0533dee.webp	/uploads/a05530f4-5d19-4c4a-9b20-187d38d8058c.png
\.


--
-- Data for Name: awakening_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.awakening_levels (id, mech_id, level, stat_bonus, special_effect, requirement) FROM stdin;
fc419c88-a6c6-4625-99c4-ec0b7133af7f	dd80f22d-8562-4920-99d0-f6f858347960	1	{"hp": 800, "atk": 120}	\N	Shadow Warrior Shard x30
645df991-c167-40b9-887a-8e370d2cde03	dd80f22d-8562-4920-99d0-f6f858347960	2	{"hp": 1200, "atk": 180, "def": 60}	Thunder Slash chains +1 target	Shadow Warrior Shard x60
15774497-a0a6-42f6-a2b9-aaae73da8153	dd80f22d-8562-4920-99d0-f6f858347960	3	{"hp": 1800, "atk": 260, "critRate": 0.03}	Shadow Step leaves a shock field	Shadow Warrior Shard x100
\.


--
-- Data for Name: awakening_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.awakening_nodes (id, level_id, "position", attribute) FROM stdin;
4d71e31b-6d3a-436b-9959-e48d1d1b5d01	fc419c88-a6c6-4625-99c4-ec0b7133af7f	1	ATK
36864684-0bf8-4e2b-9f95-e8b70d1c8f65	fc419c88-a6c6-4625-99c4-ec0b7133af7f	2	HP
1b9a37fe-9bd7-475d-a6d6-6269f05a0f97	fc419c88-a6c6-4625-99c4-ec0b7133af7f	3	DEF
0cb99146-3477-4e11-91bf-73d6eca72c6b	fc419c88-a6c6-4625-99c4-ec0b7133af7f	4	Crit Rate
e064bf9e-14eb-40a8-ade5-00c9a1db96a6	fc419c88-a6c6-4625-99c4-ec0b7133af7f	5	Skill Damage
75ef119e-c30c-45be-80ab-840e79da84e0	645df991-c167-40b9-887a-8e370d2cde03	1	ATK
dc9777d0-e8ba-475c-8ab2-23d9b111ed8d	645df991-c167-40b9-887a-8e370d2cde03	2	HP
5294f2a7-f128-410c-a75a-10cfcc1f529e	645df991-c167-40b9-887a-8e370d2cde03	3	DEF
6a4390d0-4618-4738-b13a-232d66c20af4	645df991-c167-40b9-887a-8e370d2cde03	4	Crit Rate
a9baaa93-42cb-4275-ae37-475db4a0cbb1	645df991-c167-40b9-887a-8e370d2cde03	5	Skill Damage
c58d2d61-206e-450e-9f7b-d4e8ad07c323	15774497-a0a6-42f6-a2b9-aaae73da8153	1	ATK
4961c3aa-ac5e-4992-9629-78c473a11937	15774497-a0a6-42f6-a2b9-aaae73da8153	2	HP
90c68b29-8c9c-463e-ade7-be7e4a515f56	15774497-a0a6-42f6-a2b9-aaae73da8153	3	DEF
f24950b1-29bd-4f97-b83c-717b93a02d03	15774497-a0a6-42f6-a2b9-aaae73da8153	4	Crit Rate
f0695164-4421-4e59-834d-edb461b3fa4c	15774497-a0a6-42f6-a2b9-aaae73da8153	5	Skill Damage
\.


--
-- Data for Name: awakening_unlocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.awakening_unlocks (id, level_id, name, description) FROM stdin;
d3ec499f-8472-4db2-811c-8aca2ad9ecfd	fc419c88-a6c6-4625-99c4-ec0b7133af7f	Node Slot	Unlocks awakening nodes.
f54d7b5f-77cb-4626-a24f-f7ab62da4ecb	645df991-c167-40b9-887a-8e370d2cde03	Exclusive Pose	Hangar pose: Storm Vigil.
2dfc6480-8ae4-4609-8780-fbcb5e2af351	15774497-a0a6-42f6-a2b9-aaae73da8153	Title: Stormbreaker	Profile title.
1ee645c3-2859-49a9-955e-f88d61532444	15774497-a0a6-42f6-a2b9-aaae73da8153	Portrait Frame	Animated lightning frame.
\.


--
-- Data for Name: build_hearts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_hearts (build_id, user_id) FROM stdin;
777a2105-b927-4150-a2a3-4e52884e7c56	df613662-82e0-4008-8edc-75d13860889a
1b8f8ab0-69e9-4b28-84b9-8671562bb0b4	df613662-82e0-4008-8edc-75d13860889a
1ad66270-01e5-4b4c-adeb-4a008413e9f4	df613662-82e0-4008-8edc-75d13860889a
\.


--
-- Data for Name: builds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.builds (id, user_id, name, description, "mechId", weapon_id, skill_ids, weapon_ids, weapon_skill_ids, hearts, created_at, updated_at, status) FROM stdin;
db75594f-da7f-4b56-97ad-c79996266cfe	df613662-82e0-4008-8edc-75d13860889a	Gold standart		\N	b991c15e-b21d-4865-bfad-af1fb9a96375	{1b1ace4d-af8d-4c06-9e5b-724581e7c68d,ee6db5d8-29b6-47f5-b75c-3405bd9361e6,eca133eb-1740-4c86-b95b-37bbd81b2d0b,ad7461a4-2f5b-4e8a-8bf4-806e15fe1bec,8f156bd1-8a5c-4b90-8b33-82995144bf69,06e7fc27-215b-4f79-8dcd-9918feb12c0e,dfb1fde7-8ca3-4051-84e6-5b987543c841,84a3dcc1-8d6e-480d-a5f1-1ad0cb233a50,9d078a31-91b9-4482-8994-94129e7dc146,ea680ffd-da36-4d65-8682-e376cbb12758}	{}	{}	0	2026-07-23 10:19:17.157	2026-07-23 10:19:18.871	Published
1b8f8ab0-69e9-4b28-84b9-8671562bb0b4	a822ed9a-6e18-4b0d-bae4-2a60279bc24e	Berserk mode		7d43f296-cf8e-49e7-8f92-e54e5c26ff84	\N	{9692d2fb-ae73-4611-948b-4cddb0d74954,964978ec-879e-4ca4-a5e6-641e7dd4e681,159876ca-dc5f-49d7-9d11-a0dd5103847a,6206becf-4489-4651-bf97-ab5d937295c0,d1dbffc7-a56d-4a5d-b75b-4711784f6d9c,546c622e-452b-4c85-ae74-3ef2083af07c,f1c8d608-d1fb-46cb-8440-2a902da19296,1f126e5d-2cec-4eeb-bd6e-d59294cf5308,08c0ced6-8491-4623-b0c5-87bd22271dab}	{}	{}	1	2026-07-21 14:21:03.292	2026-07-22 14:44:55.268	Published
1ad66270-01e5-4b4c-adeb-4a008413e9f4	a822ed9a-6e18-4b0d-bae4-2a60279bc24e	Build from BanzaiFun	## Build for each day \nSome interesting Idea to use #[Shadow Warrior] with #[Ninja Spikes Gun]	dd80f22d-8562-4920-99d0-f6f858347960	\N	{ab4b84ba-fd70-4cfb-986f-3616621be733,c6b3b652-1596-4567-81a9-8a63cf680318,25d5767a-569d-40bc-a88d-c729a553248b,741c35cb-2732-459d-b94d-1a3d1233dced,806b2ed1-270e-4fc5-8aeb-49143429e7bb,1403b741-e39c-4b4d-96e0-07bddb897967,5f9eb0f5-5a32-4e26-a9c5-d36526b36d39,5f9eb0f5-5a32-4e26-a9c5-d36526b36d39}	{dfb1c6de-9740-4406-b101-651fb6139b0a}	{"dfb1c6de-9740-4406-b101-651fb6139b0a": ["e17c9a90-76e9-4af2-9c9c-497df46734c0", "fc6d6838-be7d-4104-86af-6a099331d1eb", "03ad8ed5-5b9b-4a20-a32e-cbd107b51e1e", "914f5f10-4cfb-4ae2-a5ca-f4920a180713", "49f83889-b2a6-49c3-a40c-7191422b2b87", "28917713-177c-48bf-a88e-88767b17bc3b", "4f7838d9-d942-4d02-9919-fb0f521fb10f", "29ddd88b-fc5d-4121-a73c-f09c3d4799f3"]}	1	2026-07-20 17:38:04.9	2026-07-22 14:44:56.198	Published
777a2105-b927-4150-a2a3-4e52884e7c56	df613662-82e0-4008-8edc-75d13860889a	Gold standart		999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	\N	{9933281a-55d2-4bb8-bc03-c6e21f0428d1,ca2a6695-120f-4012-bf2f-d34466f88b4c,d7acccd6-ff4d-4e26-a58a-23587b018c4a,a9c67628-7d1a-475c-8b48-455db27f9af0,136b3791-3211-4d6d-8863-88975a88e980,fa81d173-ef2b-48c5-ae93-3f0a82144af9,3834a998-60ea-4d78-9940-e2f947670f73,db49557a-826c-4f1f-bccd-15c3c1e5402f,81713bd7-3117-4d7f-9166-b2a193cc12d3,f983f4b5-b432-4364-9f6a-57f3b9b97445}	{}	{}	1	2026-07-22 14:44:50.168	2026-07-22 22:44:47.957	Published
\.


--
-- Data for Name: helper_ranks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.helper_ranks (id, helper_id, rank, effect) FROM stdin;
f083d54f-d652-4753-a91c-cad8b57747ad	405dd10b-974f-4faf-bd51-8af86622f444	1	ATK +5%
cecc1260-8c8e-45b6-9390-b3fa5d3c7b56	405dd10b-974f-4faf-bd51-8af86622f444	2	ATK +8%
b4a8385c-cd1a-4ead-a577-4e15c0f3ea29	405dd10b-974f-4faf-bd51-8af86622f444	3	ATK +12%, skills charge 10% faster
\.


--
-- Data for Name: helpers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.helpers (id, mech_id, weapon_id, name, passive_effect) FROM stdin;
405dd10b-974f-4faf-bd51-8af86622f444	dd80f22d-8562-4920-99d0-f6f858347960	\N	Darren	ATK +5%
\.


--
-- Data for Name: mech_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mech_skills (id, mech_id, name, description, base_stats) FROM stdin;
d2edd801-319b-4947-bc6d-9cae2a01427f	dd80f22d-8562-4920-99d0-f6f858347960	Thunder Slash	A lightning-charged blade sweep that arcs between enemies.	{"range": 6, "damage": 240, "cooldown": 4.5}
fd8e4504-dd83-4697-8478-ab10e0d9b018	dd80f22d-8562-4920-99d0-f6f858347960	Shadow Step	Blink behind the densest enemy cluster.	{"cooldown": 8, "invulnSeconds": 0.5}
\.


--
-- Data for Name: mech_traits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mech_traits (id, mech_id, trait_id) FROM stdin;
67ea9b1f-c83f-47a6-9a02-d75852c253f3	eb241d37-6610-408b-afd0-3ecfdd0c33f6	5a0bc328-0473-44ff-aa35-26acc6254e0e
693ae13d-1a4b-4aae-932b-d47e200eef9e	eb241d37-6610-408b-afd0-3ecfdd0c33f6	1e7a6270-2687-4584-b131-1eaea04a545c
c9e5c89f-fe0d-4afb-aaf6-c477464e2d22	eb241d37-6610-408b-afd0-3ecfdd0c33f6	1414b5ba-2315-41b5-a238-c2a3b93ef5d8
3fac8d12-9191-4e17-a652-7c0562c9699e	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f19d88d8-8c3e-463f-b96c-ccc726427e5b
8b035a49-8bff-4dcc-85c8-5480c263b0fc	1560a1b5-ea7f-47db-8852-cdc6aaea3318	fe925319-8a6c-4724-8c39-a353afd74b72
7e5be61b-19fe-4e79-af79-0d549b46016a	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f19d88d8-8c3e-463f-b96c-ccc726427e5b
71cd79f2-0b91-41d6-ba12-667c4a8e41d8	1560a1b5-ea7f-47db-8852-cdc6aaea3318	4c0e3966-d8d5-4895-aa6d-8bcd14824983
4003c3a5-9ce5-4af0-966e-5efcc7743495	1560a1b5-ea7f-47db-8852-cdc6aaea3318	edc9cbf5-73b6-4322-a8f5-ce7bd9226535
ce7dd491-a6a0-434d-8148-97b6b40906b1	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	752cdc21-b370-4f9d-ae0f-d26d9b680e36
ac4d96aa-311f-4062-bc42-19e90bb37e56	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f19d88d8-8c3e-463f-b96c-ccc726427e5b
7dfc635a-62c3-4251-8c45-9beac38def9b	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	41caa475-8e40-4bfa-aacd-d5187a710689
3eac99b6-a804-4c36-b9b3-6ef6ba6c3105	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	edc9cbf5-73b6-4322-a8f5-ce7bd9226535
4da2eddc-5f78-4d13-bf0e-669b4d31ee8c	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	b91916b6-e4a2-47eb-8df9-b3ff4808a46f
29fb6650-20ae-4208-9515-5c3f6c5ee1f6	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f19d88d8-8c3e-463f-b96c-ccc726427e5b
beafc576-2aa3-4d56-978f-1deffc08d77b	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	4c0e3966-d8d5-4895-aa6d-8bcd14824983
26421e02-fd3d-42ba-955d-f3206d432afd	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	1414b5ba-2315-41b5-a238-c2a3b93ef5d8
339b9b09-f290-493f-b29a-46e154248764	b8e35f05-f8a3-4e89-a207-be3c79678456	fe925319-8a6c-4724-8c39-a353afd74b72
da968e10-cc82-419a-846a-d2b249d4f09e	b8e35f05-f8a3-4e89-a207-be3c79678456	f19d88d8-8c3e-463f-b96c-ccc726427e5b
f0f35f73-56cb-4b18-b55e-9e5939542677	b8e35f05-f8a3-4e89-a207-be3c79678456	f850be31-ff74-4ba4-8543-e32f92fed8b8
d1df3ae6-9b83-44ac-bc63-23e9e0a931fd	b8e35f05-f8a3-4e89-a207-be3c79678456	edc9cbf5-73b6-4322-a8f5-ce7bd9226535
a17a5939-5f66-4df8-a699-4ca867b4fca8	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	752cdc21-b370-4f9d-ae0f-d26d9b680e36
71d9e527-5792-409c-bb1a-ee9dc2b623ab	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f19d88d8-8c3e-463f-b96c-ccc726427e5b
17c036fa-3455-4abf-affa-73d04c14ab56	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	41caa475-8e40-4bfa-aacd-d5187a710689
7fb0c8d0-6eb8-4783-bfbb-a03904df0f48	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	12a9eb00-dfcb-4e8d-a65d-aba0a7c5044e
1119dde0-b1ed-41e4-aaae-4ed783a13af1	dd80f22d-8562-4920-99d0-f6f858347960	9189143e-4766-4dc0-b9ab-a1c43680e852
ae736057-3c63-4af7-9b7a-cbae2ace696e	dd80f22d-8562-4920-99d0-f6f858347960	12a9eb00-dfcb-4e8d-a65d-aba0a7c5044e
a6a0a661-4b5d-4938-b9f8-28655881fdfb	dd80f22d-8562-4920-99d0-f6f858347960	d073f4c0-c5da-40d5-9803-5f4ebb93e9c2
7677e86a-7822-4df7-9373-7c896a87db43	dd80f22d-8562-4920-99d0-f6f858347960	f19d88d8-8c3e-463f-b96c-ccc726427e5b
\.


--
-- Data for Name: mechs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechs (id, name, epithet, rank, special_bonus, lore, image_url, type_id, icon_url, rank_up_preview, card_skill_icon_url) FROM stdin;
b8e35f05-f8a3-4e89-a207-be3c79678456	Nocturnal Silverlord	Dark Knight	S	ATK +10%	\N	/uploads/34175de9-ab39-425c-b582-a662ba5bc4bb.webp	39a4b1b1-68e5-4aac-9a31-57e55afcb409	/uploads/03de1070-fb30-42ba-a8df-bacbbe663db0.jpg	{"Initial DMG +50%","[Boomerang] Initial count +1","Initial Mag +50%","Ice Dart trap trigger chince increased","Initial [Ice Dart] effect","Randomly gain 1 buff of this Mech at the start of battle","Evolves into Frost Bullets, Penetration +1, 30% chance to freeze enemies"}	/uploads/2cba7b18-fcff-4cd7-8ece-506d05587bf3.jpg
dd80f22d-8562-4920-99d0-f6f858347960	Shadow Warrior	Shadow Hunter	S	ATK +10%	Forged in the silent forges of the Umbra Collective, the Shadow Warrior strikes before the thunder is heard.	/uploads/aef6067b-fdd7-4d85-95a8-fd2c5df82d78.webp	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/7d5428f3-2364-4592-a51b-4b91091f9089.png	{"Initial DMG +50%","[Multiple Splits] quantity increased","Initial Projectile +1","Ninja Shuriken evolves into Boomerang","Initial effect: [Large Shuriken]","Randomly gain 1 buff or this Mech at the stat of battle","Upon taking DMG, releases a Smoke Grenade, grating 3 sec of invisibility, Cooldown 30 Sec"}	/uploads/06fc62e5-efe2-4d8e-bc72-31a433ddc0b0.png
1560a1b5-ea7f-47db-8852-cdc6aaea3318	Frost Overlord	Frostblade Commander	S	ATK +10%	\N	/uploads/34721e6d-3430-4226-9160-abade604b0a5.webp	39a4b1b1-68e5-4aac-9a31-57e55afcb409	/uploads/c9747e8f-9f86-4695-94cb-b324baa7ce04.jpg	{"Initial DMG +50%","[Stationary Fire] effect enhanced","30% chance to freeze enemies on hit","DMG to frozen enemies +100%","Initial [Shielded Shooting]","Recover 5% HP when [Shielded Shooting] ends, recover an extra 10% when bottling players","Bullet Penetration +2"}	/uploads/2871f6ac-ecb4-4a70-b48b-82c9547c30aa.jpg
ea701ac5-9a74-44e5-9bc2-296435811a1c	Fire Judgement	\N	S	\N	\N	/uploads/ca96452a-153e-4357-b651-f26193fffe64.jpg	94b3df23-fe2f-4155-9bd0-b3449544ddd3	/uploads/20e576f2-3824-406a-bcd4-2001fc1ceab6.jpg	{}	/uploads/6122c508-ab31-4d84-aa2f-74f507f18a23.jpg
d3e0d08d-0335-486d-aee6-cdb80ca05ec2	Optimus King	Optimus Suprime	S	ATK +10%	\N	/uploads/2dfd9b73-e38e-480c-8bc0-3d67159737f9.webp	92c90c03-21d5-44f0-8be9-9f6548d3ab11	/uploads/54c24db3-6aad-4070-9da2-cbbbf1a13bb7.jpg	{"Initial DMG +50%","[Lightning Shot] Frequency Boost","Thunder Blade paralyzes enemies on hit.","Thunder Blade initial Range +50%","Initial [Thunder Blade]","First transformation into Optimus Tank: DMG Immunity +30%, DMG +100%","Triggers only once the start of battle. Immediatly transform into Optimus Tank for 15s."}	/uploads/03637624-f707-4314-adb0-23f9d3b346dc.jpg
151659eb-87bc-4f27-959f-e6ba974b1b32	Frost Scorpion	\N	Standard	\N	\N	/uploads/59ad851f-f69a-4ab1-ba15-f3805de8af29.jpg	39a4b1b1-68e5-4aac-9a31-57e55afcb409	/uploads/0a955815-56c1-4bb4-8b32-5ed29f50ee2f.jpg	{}	/uploads/236f87b1-eb6c-4f88-b68a-ef18ad64ec27.jpg
7d43f296-cf8e-49e7-8f92-e54e5c26ff84	Thunderous Judgment	\N	S	\N	\N	/uploads/8e7c6bca-84d2-425d-b056-ead0b0b7a106.webp	92c90c03-21d5-44f0-8be9-9f6548d3ab11	/uploads/d464e7e7-d7ad-4170-a67a-c0a3c099cbef.jpg	{"Initial DMG +50%","[Berserk Mode] grants an extra 30% Crit Hit Rate","Shots have a 30% chance to paralyze enemies for 1s","DMG to paralyzed enemies +100%","Initial [Chain Lightning]","At max level, Projectile +2","Upgrade to Thunder Bullets. 100% chance to create Lightning Stardust on hit"}	/uploads/8cfffe7c-f2a2-469e-ba73-87780d65a7ea.jpg
d01f48fb-637d-4c52-96b1-a321520a2ac7	Crimson Phantom	\N	S	\N	\N	/uploads/6ea6bca1-a195-43e5-80a0-d538e58b2066.jpg	86ab792d-d234-4702-a021-779e39aabe32	/uploads/1b349e30-0431-4314-950d-9d620d676c5a.jpg	{}	/uploads/61908adb-07a5-444d-8045-8cca1cbcf34f.jpg
7d5ddefc-ca69-4d2c-bb74-2d129a440e79	Pirate Gunner	\N	Standard	\N	\N	/uploads/f36b8ce6-5520-4881-8ca6-23be7c0dfcfe.jpg	86ab792d-d234-4702-a021-779e39aabe32	/uploads/15e9ea04-1216-4ad5-a59d-85e024919b31.jpg	{}	/uploads/661e879a-dfaa-4881-a37d-0ab370a5a9d1.jpg
98989053-9241-4882-8c1f-e396c7bde0f4	War Scourge	\N	S	\N	\N	/uploads/4380f3a3-856f-4c77-b718-5807980da7ed.jpg	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/597c619f-3aab-4ae3-866f-b2e195816787.jpg	{}	/uploads/7d21b3b2-d599-45e9-b849-9cd0db983792.jpg
c81bf534-9d83-4d4c-9b03-f32864658f5f	Crystal Queen	\N	S	\N	\N	/uploads/e0725196-7691-4fb0-9770-617e775ce316.jpg	f6b13a07-6376-40fe-a29b-99c78f118ed5	/uploads/a81a3ff1-ed6e-4471-9f98-d4cfc99ce8a4.jpg	{}	/uploads/74c60d3c-aa74-49dd-804f-df527b82ad4d.jpg
59b82669-b886-4616-947c-94d1ec436774	Super Idol	\N	S	\N	\N	/uploads/8c18bbf5-d431-4be9-98dd-9ab45359fc20.jpg	f6b13a07-6376-40fe-a29b-99c78f118ed5	/uploads/56a1cf82-599d-4f7f-86c7-0796f65622fb.jpg	{}	/uploads/0be5dd72-7f83-45df-89a0-eba635b5e317.jpg
70a95a22-43a2-443b-b749-339a597981d8	Thunder Guard	\N	Standard	\N	\N	/uploads/a0ba3abf-8cdf-4488-b69b-663d09bbc894.jpg	92c90c03-21d5-44f0-8be9-9f6548d3ab11	/uploads/3199c6e6-86f3-4495-a5b6-d15890e1866b.jpg	{}	/uploads/7ce18dcd-ce7d-451a-938b-b71ead13db6b.jpg
dca8e863-293d-46f5-aaa1-5efd0ae93710	Fire Dragon	\N	Standard	\N	\N	/uploads/0a070f70-8850-430c-8bcd-b6fe75129f04.jpg	94b3df23-fe2f-4155-9bd0-b3449544ddd3	/uploads/6bdcb33d-7d8d-43b3-bbf6-11f242a8a122.jpg	{}	/uploads/cf2a44d3-640a-45f2-b1de-59d29ffc11be.jpg
f52199d2-01b9-463d-bfdf-94c8a1d1f28f	Doomsday Tank	\N	Standard	\N	\N	/uploads/57e89e6c-22c6-4bf3-9cfc-8cf3bb4b9cf4.jpg	86ab792d-d234-4702-a021-779e39aabe32	/uploads/5017fbc1-96bf-4f28-a02a-10b43a67977a.jpg	{}	/uploads/78cc8310-2429-4a0d-b512-a9b6de81bc2f.jpg
09b57a99-2a08-4cc2-84ab-adb8b470cd5f	Coldfront Sentinel	\N	Standard	\N	\N	/uploads/caadffb4-fa54-47e5-ae88-a6d1a0e1a430.webp	39a4b1b1-68e5-4aac-9a31-57e55afcb409	/uploads/b6818447-12eb-437d-a4d7-1034c0b89ee9.png	{}	/uploads/5e8b6d60-9bb1-4d17-bcb3-9ede3d34afd3.png
4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	Future Warrior	Iron Heart	S	ATK +10%	\N	/uploads/f71ca61b-95cc-457a-b9e8-475ca31eeae9.webp	f6b13a07-6376-40fe-a29b-99c78f118ed5	/uploads/ddefeac0-6024-409d-b3cb-d543cfbda9c4.jpg	{"Initial DMG +50%","[Projectile Boost] effect increased","Laser apply 30% Vulnerability, lasting 5sec","DMG to frozen enemies +100%","Initial [Laser Split] effect","At max level, select on additional buff for this Mech","Every 60 seconds generate a Laser Field lasting 30sec"}	/uploads/32f12919-0d75-4dc2-aed7-f952e290e011.jpg
eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	Azureblade Immortal	\N	S	\N	\N	/uploads/124961aa-45ce-4216-af85-e2deca89fc55.webp	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/e03aaa41-f80a-4f59-ba56-d9e6e8811a85.png	{}	/uploads/61b8dbc7-70d3-4062-9937-3f2b9f55e246.png
848b45e8-9220-424f-8445-dbad2d563a16	Azure Dragon Warlord	\N	S	\N	\N	/uploads/7fe5b09d-924d-419b-80c5-48ef04187c45.webp	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/1b3f54df-4c45-4f83-88cd-ded9a5e337a4.png	{}	/uploads/3ed57910-1544-471d-9115-6627550e4664.png
eb241d37-6610-408b-afd0-3ecfdd0c33f6	Abyssal Knight	\N	S	\N	\N	/uploads/3d62368b-617f-4b37-94b0-d5a4ae3b0a11.webp	86ab792d-d234-4702-a021-779e39aabe32	/uploads/9429bb5c-8639-4993-aea3-16698a00ff50.jpg	{}	/uploads/ef2244a8-916d-47ad-b05b-37067a3eb0b8.jpg
999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	Awakening	\N	Standard	\N	\N	/uploads/54e53a21-56e9-4865-ab77-57042175a8a3.webp	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/617b4322-ef8f-4b33-bac2-fc6a1f6feaa6.png	{"Initial Projectile +1","[Projectile Boost] no longer reduces DMG","Unlock [Full DMG Boost] option","[Penetration Boost] Effect Boost","30% chance for Split Bullets to trigger","Initial [Hit Split] effect","[Double Projectile] evolves to [Triple Projectile]"}	/uploads/e190b280-2719-46ab-91f0-eefc757ac4ec.png
b1dd6f43-3f20-4a90-8b89-2c1902f91373	Flamefeather Archer	\N	S	\N	\N	/uploads/10f254dc-389a-4827-a5dc-0ddd6cebd01a.jpg	94b3df23-fe2f-4155-9bd0-b3449544ddd3	/uploads/85a1e94d-6309-4ab3-bcf4-fdb74b46f566.jpg	{}	/uploads/e32ea801-f08d-4a94-b6e9-7058ac5b6797.jpg
6f00a69b-014d-4006-828e-d13e9540de88	Mech Nezha	\N	Standard	\N	\N	/uploads/836c1473-59d8-4df0-a752-bb0e3be0351f.jpg	94b3df23-fe2f-4155-9bd0-b3449544ddd3	/uploads/49effc68-8696-44e9-b4ec-0e2cf5261268.jpg	{}	/uploads/6cda5245-11f9-4480-a4bf-773b61ce9bdd.jpg
fcc5b73f-edf4-43b9-b134-63db939ffd1d	Rally Wrecker	\N	Standard	\N	\N	/uploads/711b5f3b-dd5e-4170-9529-50c90c24bbe0.jpg	86ab792d-d234-4702-a021-779e39aabe32	/uploads/a7b86e5f-f91c-4d0b-87f6-f3f2a70ecc02.jpg	{}	/uploads/2cdc8c1c-a721-4ec5-bf8e-c46e8a7d72c8.jpg
c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	Silver Lancer	\N	S	\N	\N	/uploads/9b46964d-895e-4fe3-af24-55d058e3c257.jpg	92c90c03-21d5-44f0-8be9-9f6548d3ab11	/uploads/c7d226cd-210f-49d6-8de7-fd7977fe4e85.jpg	{}	/uploads/0fa56f2f-bf78-4cd9-8246-8acec1ef4c5c.jpg
a431dd1f-3555-49b3-9a7b-d81985bc6f1e	Thunder Beast	\N	Standard	\N	\N	/uploads/997168a9-6382-43f5-b736-02533736e5fd.jpg	92c90c03-21d5-44f0-8be9-9f6548d3ab11	/uploads/3cdf6b36-e5ec-411e-b986-5985bc3ba4eb.jpg	{}	/uploads/61b0593d-9919-413a-a621-3709cb01f11a.jpg
06d09d71-5fbd-4a4b-8835-183859db026a	War Dragon	\N	S	\N	\N	/uploads/22a6e7c0-32dc-4689-b2b2-d8c3ebcd2dbe.jpg	94b3df23-fe2f-4155-9bd0-b3449544ddd3	/uploads/2779d070-6a6c-4058-8615-e339634632df.jpg	{}	/uploads/aed57836-950f-485b-8398-ce1817000f2a.jpg
66b98c4b-3390-48cc-a95c-fb2b48373acf	War Machine	\N	Standard	\N	\N	/uploads/276adb98-ebb6-49c9-83e5-311b9c684203.jpg	470e9b8f-fd3a-4ab8-b588-3e43e490445c	/uploads/b12cdf6a-3c50-412b-944b-219521c3abd8.jpg	{}	/uploads/6e31e348-d3fd-4278-a2ad-8618f5712924.jpg
fd325003-20ee-4234-a92a-d50d95357e9b	Wukong	\N	S	\N	\N	/uploads/63c9d09b-1e8b-47fc-9581-401581d31888.jpg	86ab792d-d234-4702-a021-779e39aabe32	/uploads/475dc455-4864-43d4-bd76-a9fe54b06b85.jpg	{}	/uploads/81bb28b7-ba6c-4ac2-8344-7734e8ccc657.jpg
\.


--
-- Data for Name: pilots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pilots (id, name, unlock_boost, relationship_bonus, bonus_per_level, icon_url, background_url, mech_id, weapon_id) FROM stdin;
bdafa448-cfd9-42ca-83ca-244791f80632	Akira	ATK + 10%	Every 80 attacks, throw 5 large Shurikens around	{"DMG +30%","Trigger frequency increased","50% chance to trigger Lightning upon hitting enemy","Throw 2 large Shurikens consecutively"}	/uploads/7acf4e24-198b-47d7-b03e-bbd0d23ddba3.jpg	/uploads/330e7c34-8366-4e7e-a283-53ae74735314.webp	dd80f22d-8562-4920-99d0-f6f858347960	\N
0adcaa23-2301-40a7-bb54-a1ccbf903dd8	Darren	DEF +10%	Every 60 Sec, summon 10 Spikers on random enemies	{"DMG +30%","Cooldown Time -25%","Spikes count increased","Evolve into More Spikes, DMG +100%, DMG Frequency +50%"}	/uploads/8eb109fa-37ce-4cd0-8d37-35b4d21aa431.png	/uploads/a6921b4c-f12c-4fb4-8955-aa46af35aaee.webp	\N	dfb1c6de-9740-4406-b101-651fb6139b0a
d4a22c33-c12c-4551-93d7-9244b664f7ae	Miquella	HP + 10%	Every 20 shots, summons 3 Thunder Blades to attack nearby emenies	{"DMG +30%","Trigger frequency increased","Thunder Blade +2","Thunder Blade Count +100%"}	/uploads/db797d72-9ce4-4eba-9b86-e80aaba93e8f.jpg	/uploads/70abc8c0-805f-4580-8ac6-45df2c3b3e26.webp	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	\N
8cd94461-9d1f-4ea9-bbee-52f97f2810e6	Kira	HP +10%	Summon 1 Ice Light Emitter every 40 shots, lasting 3s	{"DMG +30%","Trigger frequency increased","Ice Light Emitter size +50%","Ice Light Emitter +1"}	/uploads/071daead-21ab-495c-a3a0-0bda342a24b0.jpg	/uploads/94aedfc1-1963-4831-863e-a7928e029695.webp	1560a1b5-ea7f-47db-8852-cdc6aaea3318	\N
8e41814b-b8ff-49e3-b664-ccf851a8281d	Shiyo	DEF +10%	Every 30 attacks, unleashes 4 large Shockwaves	{"DMG +30%","trigger frequency increased","Large Shockwave has a 100% chance to ignite enemies","Large Shockwave Range +100%"}	/uploads/d44551f0-872f-4816-b0f9-ffec23f00ca7.jpg	/uploads/25f94d5c-6925-4e25-9c9a-25047975e8c0.webp	\N	\N
e52eabad-ea1a-4504-be68-eafcc9265e36	Musk	ATK +10%	Summon 3 laser emitter every 60 attacks	{"DMG +30%","Trigger frequency increased","Laser Emitters +1","Double Laser Emitters"}	/uploads/d01cfafa-ec11-4778-bd80-27bfc1ac1862.jpg	/uploads/a2f51b9c-150e-42e4-bb89-0d775278b3a4.webp	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	\N
2f31047f-d477-468a-b882-e00ceb123d15	Gordon	ATK +10%	Summon an Ice Rain every 120 shots	{"DMG +30%","Trigger frequency increased","Ice Rain Duration +50%","Ice Rain Duration doubled"}	/uploads/7462f94d-0331-44b5-b207-7c55b63501ce.jpg	/uploads/b2067cc1-547b-4de7-9148-7346d2e3e442.webp	b8e35f05-f8a3-4e89-a207-be3c79678456	\N
d6d03999-f226-47eb-99e1-bbd9f2ab2537	Ricca	ATK +10%	Every 120 attacks, generate up to 4  powerful Chain Lightning nearby	{"DMG +30%","Trigger frequency increased","Chain Lightning Target +3","Chain Lightning count doubled"}	/uploads/2a36b84a-e599-45e7-b0a2-3544103c8907.jpg	/uploads/568b38e1-8932-4519-9a59-8ca549583859.webp	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	\N
\.


--
-- Data for Name: skill_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill_nodes (id, weapon_id, parent_id, name, description, appearance_level, type, sort_order, mech_id, repeatable) FROM stdin;
ab4b84ba-fd70-4cfb-986f-3616621be733	\N	\N	Projectile Boost	Projectile +2	1	Normal	0	dd80f22d-8562-4920-99d0-f6f858347960	f
c6b3b652-1596-4567-81a9-8a63cf680318	\N	ab4b84ba-fd70-4cfb-986f-3616621be733	Projectile Boost	Projectile +2	1	Normal	0	dd80f22d-8562-4920-99d0-f6f858347960	f
25d5767a-569d-40bc-a88d-c729a553248b	\N	ab4b84ba-fd70-4cfb-986f-3616621be733	Projectile Boost	Projectile +3 Effect doubles inside smoke	1	Premium	1	dd80f22d-8562-4920-99d0-f6f858347960	f
741c35cb-2732-459d-b94d-1a3d1233dced	\N	\N	Penetration Boost	Shurikens and small Shurikens Penetration +2	1	Premium	1	dd80f22d-8562-4920-99d0-f6f858347960	f
fac55936-0a4f-4e94-a198-cfd9e214f186	\N	\N	Link - Spikes	Shuriken has 5% chance to trigger. Spikes upon hitting enemies	1	Premium	2	dd80f22d-8562-4920-99d0-f6f858347960	f
806b2ed1-270e-4fc5-8aeb-49143429e7bb	\N	\N	Split Hit	Kill an enemy to split 3 small Buzzsaws	1	Normal	3	dd80f22d-8562-4920-99d0-f6f858347960	f
1403b741-e39c-4b4d-96e0-07bddb897967	\N	806b2ed1-270e-4fc5-8aeb-49143429e7bb	Split Hit	Kill an enemy to split 6 small Buzzsaws	1	Premium	0	dd80f22d-8562-4920-99d0-f6f858347960	f
d87ffb75-6e28-4e43-a46f-fb57574db9c4	\N	806b2ed1-270e-4fc5-8aeb-49143429e7bb	Poisoned Split	Small Shurikens have 50% chance to apply poison effect	1	Premium	1	dd80f22d-8562-4920-99d0-f6f858347960	f
aeb44c83-1f43-49b7-bccf-3d2702dc4b1f	\N	\N	Big Shuriken	Throw a large Shuriken that can return every 8 attacks	3	Premium	4	dd80f22d-8562-4920-99d0-f6f858347960	f
2e740ea8-6648-46c4-9bf3-e03840b403cb	\N	aeb44c83-1f43-49b7-bccf-3d2702dc4b1f	Increased Size	Large Shuriken Size +50%	1	Normal	0	dd80f22d-8562-4920-99d0-f6f858347960	f
42c1cbbf-1938-42f7-87fe-db0834e47d1d	\N	aeb44c83-1f43-49b7-bccf-3d2702dc4b1f	DMG Bosst	Large Shuriken DMG +50%	1	Normal	1	dd80f22d-8562-4920-99d0-f6f858347960	f
34e7ce65-e454-4632-90f8-7b0de68e24e9	\N	aeb44c83-1f43-49b7-bccf-3d2702dc4b1f	Lightning Evolution	Evolve into large Lightning Shuriken, trigger lightning upon hitting enemies	1	Premium	2	dd80f22d-8562-4920-99d0-f6f858347960	f
60f06580-5f94-431a-b4d4-ac2d0aab71c0	\N	aeb44c83-1f43-49b7-bccf-3d2702dc4b1f	\N	Evolve into large Spiral Shuriken Throw Count +1	1	Core	3	dd80f22d-8562-4920-99d0-f6f858347960	f
bb1974fc-0d98-4943-9e54-da7adae5f7c9	\N	\N	Smoke Bobmb	Release 1 Smoke Grenade to reduce enemy Movement Speed every 8 Sec	3	Premium	5	dd80f22d-8562-4920-99d0-f6f858347960	f
52dca712-f33b-4322-ade6-4126813dc8c8	\N	bb1974fc-0d98-4943-9e54-da7adae5f7c9	Smoke Diffusion	Smoke Range +50%	1	Normal	0	dd80f22d-8562-4920-99d0-f6f858347960	f
0659077e-03fd-4154-bbbc-1b0f039fd011	\N	bb1974fc-0d98-4943-9e54-da7adae5f7c9	Fragile Smoke	DMG to enemies in smoke +100%	1	Premium	1	dd80f22d-8562-4920-99d0-f6f858347960	f
90e349c8-0ae3-421d-aa72-92d9bc014bba	\N	bb1974fc-0d98-4943-9e54-da7adae5f7c9	Quick Attack Smoke	Fire Rate +120% in Smoke	1	Normal	2	dd80f22d-8562-4920-99d0-f6f858347960	f
59decca8-f80f-4df3-9f79-42a794f2dd0c	\N	bb1974fc-0d98-4943-9e54-da7adae5f7c9	\N	Smoke evolves into Poisonous Smoke, attacks apply poison effect	1	Core	3	dd80f22d-8562-4920-99d0-f6f858347960	f
00334105-ab9c-4c29-bbcd-3d8d9fdad531	\N	\N	Poisoned Shuriken	Attack applies poison effect	5	Normal	6	dd80f22d-8562-4920-99d0-f6f858347960	f
68f1d747-0695-4261-a838-f433836c7069	\N	00334105-ab9c-4c29-bbcd-3d8d9fdad531	Poisoned DMG Boost	DMG +100% to poisoned enemies	1	Premium	0	dd80f22d-8562-4920-99d0-f6f858347960	f
5f9eb0f5-5a32-4e26-a9c5-d36526b36d39	\N	\N	DMG Boost	DMG +60%	1	Normal	7	dd80f22d-8562-4920-99d0-f6f858347960	t
52cc05a1-e2fd-4bed-9ca9-8fde9e8eb0d8	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
662d27ad-42f7-463a-ab78-805c2133f421	\N	52cc05a1-e2fd-4bed-9ca9-8fde9e8eb0d8	Projectile Boost	Projectile +1	1	Normal	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
0b0a21f2-e159-413d-afd9-f61ad83d0f68	\N	52cc05a1-e2fd-4bed-9ca9-8fde9e8eb0d8	Stable Shooting	When standing still, Projectile +3	1	Premium	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
f5f02483-d014-4bf9-924c-41b263b3be5b	\N	\N	\N	Bullet DMG Upgrade, Explosion Range +100%, Headshot Rate +10%	1	Core	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
7099a90e-de84-4737-9f12-e5b42a7b2f36	\N	\N	Link-Demon	Killing enemies has a 20% chance to summon a Demon Bot	1	Premium	2	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
543d4aa9-8cc4-4d33-9665-bf321e773cfe	\N	\N	Summon Gargoyle	Every 10 attacks, a Gargoyle smashes down	3	Premium	3	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
b00df0f7-0283-4362-9554-2f346b695e08	\N	543d4aa9-8cc4-4d33-9665-bf321e773cfe	Continuous Shock	Gargoyle continues to attack for 4 seconds after landing	3	Premium	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
ea170b8f-7e52-45af-b8a6-bf32365a3daf	\N	543d4aa9-8cc4-4d33-9665-bf321e773cfe	DMG Boost	Gargoyle DMG +50%	3	Normal	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
2cbbfb61-94f8-43eb-a222-6690af3262a2	\N	543d4aa9-8cc4-4d33-9665-bf321e773cfe	\N	Gargoyle Trigger Frequency +100%, Range +50%	3	Core	2	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
a413b0d2-c94a-4e5f-86d6-b52f79a30e44	\N	\N	Bat Bomb	When a target is killed, there is a 10% chance to summon a Bat Bomb	3	Premium	4	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
e5036a7e-301f-41ec-a65b-f7f3b69ca9a3	\N	a413b0d2-c94a-4e5f-86d6-b52f79a30e44	DMG Boost	Bat Bomb DMG +50%	3	Normal	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
80bdc8a9-3f51-4e20-b68b-c09571c3352a	\N	a413b0d2-c94a-4e5f-86d6-b52f79a30e44	Range Boost	Bat Bomb Explosion Range +100%	3	Premium	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
7629b87f-ce5e-4b96-8759-3db0ee7b0981	\N	\N	Homing Missile	Fires missiles every 5 seconds at up to 10 nearby enemies	5	Premium	5	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
27691f87-ec31-4da4-a023-6f3a62233c86	\N	7629b87f-ce5e-4b96-8759-3db0ee7b0981	DMG Boost	Missile DMG +50%	5	Normal	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
eb0f2d81-a01a-4a06-a13d-d446afed84f6	\N	7629b87f-ce5e-4b96-8759-3db0ee7b0981	Rapid-Fire Missile	Max missile targets +3	5	Normal	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
3d4ff511-23d4-4591-9762-28515758f45c	\N	7629b87f-ce5e-4b96-8759-3db0ee7b0981	High Explosive Missile	Missile Headshot Rate +10%	5	Premium	2	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
bf878ac7-3508-4b0b-8c52-d6aa2413b09b	\N	\N	Fire Rate Boost	Fire Rate +60%	1	Premium	6	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
1b49a565-dd3b-4c0d-9d79-d69d5fcf3de1	\N	bf878ac7-3508-4b0b-8c52-d6aa2413b09b	Fire Rate Boost	Fire Rate +80%, Mag +5	1	Premium	0	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
b2170c17-6aff-4d7a-9d78-21a5a5039475	\N	bf878ac7-3508-4b0b-8c52-d6aa2413b09b	Fire Rate Boost	Each shot increases Fire Rate by 20% and DMG by 20%, resets after reloading	1	Premium	1	d01f48fb-637d-4c52-96b1-a321520a2ac7	f
08cef272-7526-40fc-a07e-1e42d953fb53	\N	\N	DMG Boost	DMG +60%	1	Normal	7	d01f48fb-637d-4c52-96b1-a321520a2ac7	t
657f1a61-e9d5-41c2-9ce3-76bde504d955	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Continuous Fire	Hit +1	1	Normal	0	\N	f
be4a425f-4771-40de-bb83-fb1e851a0726	df3a5eba-ed30-4368-bce7-859f54bc2274	657f1a61-e9d5-41c2-9ce3-76bde504d955	Continuous Fire	Hit +1	1	Normal	0	\N	f
c9528b97-3360-4cba-9a7a-0c622c82b586	df3a5eba-ed30-4368-bce7-859f54bc2274	be4a425f-4771-40de-bb83-fb1e851a0726	Continuous Fire	Hit +2	1	Premium	0	\N	f
f624286d-78f0-4ec7-9d9c-9e460c510827	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	\N	Anchor DMG +50%, causes 2nd DMG after retrieval	1	Core	1	\N	f
b22ae18d-517e-475f-868a-562b6accf1fd	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Link - Pirate	Anchor has a chance to generate a Whirlpool upon hitting enemies	1	Premium	2	\N	f
6642fe86-d6f7-45be-b177-a2b801f741eb	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Anchor Strike	Every 3 attacks with Anchor triggers a strike attack	1	Premium	3	\N	f
a14ed4ce-84e9-42a3-bf6e-0a6d225ad211	df3a5eba-ed30-4368-bce7-859f54bc2274	6642fe86-d6f7-45be-b177-a2b801f741eb	Strike Amplification	Strike Range +50%	1	Normal	0	\N	f
0ba97770-9616-4045-9062-187b2bbea1aa	df3a5eba-ed30-4368-bce7-859f54bc2274	6642fe86-d6f7-45be-b177-a2b801f741eb	Strike DMG Boost	If one single strike attack hits at least 10 enemies, the next strike's DMG doubles	1	Normal	1	\N	f
6fc16189-fd45-4844-b9d3-3400f2319ed9	df3a5eba-ed30-4368-bce7-859f54bc2274	6642fe86-d6f7-45be-b177-a2b801f741eb	\N	Sweep DMG +50%, each strike hits 2 times	1	Core	2	\N	f
de0f13f8-0239-4106-9cad-f564ca40ecfb	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Fire Anchor	Fire anchor, leaves a Fiery Trail when thrown	3	Premium	4	\N	f
44069e76-f87e-4187-81ab-9fa8b779d462	df3a5eba-ed30-4368-bce7-859f54bc2274	de0f13f8-0239-4106-9cad-f564ca40ecfb	Scorch DMG Boost	Fire Trail DMG +50%	3	Normal	0	\N	f
b9dc42c0-e7d5-4eb0-8de6-01db386d8c38	df3a5eba-ed30-4368-bce7-859f54bc2274	de0f13f8-0239-4106-9cad-f564ca40ecfb	Scorch Ignite	Fire Trail ignites enemies on hit	3	Normal	1	\N	f
801776f9-5403-45a0-95ee-e8047c9b9687	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Anchor Enhancement	Anchor size +100%	3	Premium	5	\N	f
6e00673f-76fa-494c-8d75-2a90e5aa028f	\N	\N	Supply Magazine	Mag +2	1	Premium	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
f985a55b-28b8-412f-908d-5d4a5c318e87	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
1d6c5cb6-9927-4b1c-afb1-135191bd3ad1	\N	\N	Continuous Fire	Continuous Fire +2.	1	Normal	0	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
75d54fed-6324-4300-b379-9a3fee1b9da1	\N	1d6c5cb6-9927-4b1c-afb1-135191bd3ad1	Continuous Fire	Continuous Fire +2.	1	Normal	0	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
cba2d68b-14c1-478d-852e-5333d1d2c053	\N	75d54fed-6324-4300-b379-9a3fee1b9da1	Continuous Fire	Continuous Fire +4.	1	Premium	0	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
04c4e701-b497-4a3c-a987-0fd770b9a01d	\N	\N	\N	Continuous Fire x2, Fire Rate +50%, DMG +100%.	1	Core	1	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
824fdb80-c13f-45db-8fc8-e8063bf44e4e	\N	\N	Hull Reinforcement	Pirate Ship size +100%.	3	Premium	2	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
58f9ace7-7c16-4d85-8044-f152713d1fe3	\N	\N	Bow Reinforcement	Pirate Ship DMG +50%.	3	Normal	3	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
c0ee2f9b-8922-4add-8473-61da92c587a1	\N	\N	Pirate Ship	Summon a Pirate Ship every 8 shots.	3	Premium	4	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
677ba06a-8e93-48f7-87ca-f9618c6cfc53	\N	c0ee2f9b-8922-4add-8473-61da92c587a1	Deadly Whirlpool	Pirate Ship ramming enemies may generate a Whirlpool.	5	Premium	0	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
75751130-9b33-48ce-9332-d9a1f67d186d	\N	c0ee2f9b-8922-4add-8473-61da92c587a1	Stunning Impact	Pirate Ship knocks down enemy.	5	Premium	1	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
5652f8b5-e2c1-4f96-be60-2b1197675bfe	\N	c0ee2f9b-8922-4add-8473-61da92c587a1	Impact Tactics	Double Pirate Ship trigger frequency.	5	Premium	2	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
206fae57-df15-4129-bf91-22d44b362e38	\N	c0ee2f9b-8922-4add-8473-61da92c587a1	\N	Pirate Ship upgrade into Ultimate Battleship with much higher DMG.	5	Core	3	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
9605a867-59dc-47c1-8215-cf20618677e6	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	Projectile Boost	Throw count +1	1	Normal	0	\N	f
b1d05cba-da49-4db5-a32e-38ba49c7f23f	dfb1c6de-9740-4406-b101-651fb6139b0a	9605a867-59dc-47c1-8215-cf20618677e6	Projectile Boost	Throw count +1	1	Normal	0	\N	f
6285fcc6-f4b4-48f1-919b-8f0ab75e928e	dfb1c6de-9740-4406-b101-651fb6139b0a	b1d05cba-da49-4db5-a32e-38ba49c7f23f	Projectile Boost	Throw count +2	1	Premium	0	\N	f
b0f77bd5-839d-4a17-a01d-1c936a7b3578	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	Range Boost	Range +50%	1	Normal	1	\N	f
0555b550-1dd5-429f-ae17-e7a989d36d37	dfb1c6de-9740-4406-b101-651fb6139b0a	b0f77bd5-839d-4a17-a01d-1c936a7b3578	Range Boost	Range +100%	1	Premium	0	\N	f
c0d2a65f-73ec-4448-b7a3-278eeaa100cc	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	Duration	Duration +50%	3	Normal	2	\N	f
8421572b-9f2f-4d40-9963-46bca0094bc0	dfb1c6de-9740-4406-b101-651fb6139b0a	c0d2a65f-73ec-4448-b7a3-278eeaa100cc	Duration	Diration +50% DMG Frequency +50%	1	Premium	0	\N	f
4eaba6a6-902e-411c-87a2-e3a87e6c2b9c	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	DMG Boost	Spikes DMG per second +40% (max 200%)	3	Premium	3	\N	f
2063283b-7281-4c52-a409-eddec55dbeb7	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	Trigger Lightning	100% chance to trigger Lightning upon hitting enemy	3	Premium	4	\N	f
7761b907-13fc-435e-945f-dbb839cd593f	dfb1c6de-9740-4406-b101-651fb6139b0a	2063283b-7281-4c52-a409-eddec55dbeb7	Lightning Paralysis	Lightning has 30% chance to paralyze enemies	3	Normal	0	\N	f
75b3dcb7-b825-4b04-a6e4-9e0ade17b63d	dfb1c6de-9740-4406-b101-651fb6139b0a	2063283b-7281-4c52-a409-eddec55dbeb7	Lightning DMG Boost	Lightning DMG +100%	3	Premium	1	\N	f
8e8b3b46-1345-496c-bcab-6f2b9b66f1d3	dfb1c6de-9740-4406-b101-651fb6139b0a	2063283b-7281-4c52-a409-eddec55dbeb7	\N	Lightning creates a Spreading Electric Circle upon hitting enemies	3	Core	2	\N	f
a3f77dcc-a3fd-4f13-b65d-2fe33c48137d	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	\N	Evolve into More Spikes DMG + 100% DMG Frequency +50%	3	Core	5	\N	f
0026eba7-397b-43b3-abe4-1f5e40f897ea	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	Hit and Slowdown	Spikes applies 50% Slow effect upon hitting enemy	5	Normal	6	\N	f
f5b2d42b-68ec-4867-b549-ef71a630a1c7	dfb1c6de-9740-4406-b101-651fb6139b0a	0026eba7-397b-43b3-abe4-1f5e40f897ea	Slowdown DMG Boost	DMG +100% to slowed enemies	1	Premium	0	\N	f
b2fd347e-8358-4a8b-82cc-f61c1844ac52	dfb1c6de-9740-4406-b101-651fb6139b0a	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
fb37aa4e-f02c-4a7d-9ea9-bb6b3d35a0f0	\N	\N	Whirlpool	15% chance to produce a whirlpool when cannonball explodes.	3	Premium	5	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
75885024-a6d3-40c9-986f-e7a743d7e0a9	\N	fb37aa4e-f02c-4a7d-9ea9-bb6b3d35a0f0	Dangerous Whirlpool	Whirlpool DMG +50%.	3	Normal	0	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
3221ef28-02b8-46f3-8610-6610b2fd88a3	\N	fb37aa4e-f02c-4a7d-9ea9-bb6b3d35a0f0	Strong Whirlpool	Whirlpool gravity +100%.	3	Normal	1	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
b54cd83d-62ba-4952-aaa6-9dfe5a114b1d	\N	\N	Stun Shot	30% chance to stun enemy.	5	Normal	6	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
0462027e-ceb0-465c-9bcf-3650bceee5b9	\N	\N	Ranged Reinforcement	Explosion Range +50%.	3	Normal	7	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	f
702e6c4c-61a0-455c-870a-59392056b1c6	\N	\N	DMG Boost	DMG +60%	1	Normal	8	7d5ddefc-ca69-4d2c-bb74-2d129a440e79	t
b140a9d3-295a-46e6-8d8d-07a6dfe1b9a3	\N	\N	Projectile Boost	Projectile +1.	1	Normal	0	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
565b5a72-d7f8-4c72-87b6-6269cf27a389	\N	b140a9d3-295a-46e6-8d8d-07a6dfe1b9a3	Projectile Boost	Projectile +1.	1	Normal	0	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
64045571-03cc-404c-8cee-09a1bcba1576	\N	565b5a72-d7f8-4c72-87b6-6269cf27a389	Projectile Boost	Projectile +2.	1	Premium	0	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
94912a40-cb44-4d06-894b-b5a81025a727	\N	\N	Link-Grenade	Tactical Vehicles have small chance to launch Grenades on hit.	1	Premium	1	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	\N	\N	Tactical Vehicle	Summons a tactical vehicle every 6 seconds.	1	Premium	2	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
ea203d30-fdd7-4c26-b2da-973660831f5a	\N	b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	Homing Tactics	Tactical Vehicle count +1, actively seeks nearby enemies.	1	Premium	0	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
caeecef6-43b8-4bb6-bf99-78fa53e19c04	\N	b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	Bomb Tactics	Tactical Vehicle count +1, throws 2 small bombs per second.	1	Premium	1	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
632e90a0-b3d3-4b8d-bc86-4b4673141df2	\N	b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	Incremental Tactics	Tactical Vehicle count +1, DMG +20%.	1	Normal	2	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
d51da02e-ca23-48fb-8754-966738687d0c	\N	b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	Self-Destruct Tactics	Tactical Vehicle count +1, self-destructs after collision.	1	Normal	3	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
b0aad8d8-4d60-48ec-b585-fe34c2d0a358	\N	b0074b8a-35c9-40d7-8ad9-9f32ff2556dd	\N	Tactical Vehicle CD Speed +100%, initial count +2.	1	Core	4	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
b537a74b-6cfc-4495-87b8-c01e8f46438e	\N	\N	Tactical Mine	Drops 1 Tactical Mine every 8 meters moved.	3	Premium	3	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
8e2a3cec-355c-4154-ac76-1ea007168dee	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	Range Boost	Tactical Mine Explosion Range +50%.	3	Normal	0	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
efc6f7af-67e5-4d8a-8b69-b5352afca736	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	DMG Boost	Tactical Mine Explosion DMG +50%.	3	Normal	1	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
86448557-0d16-4ae4-a242-52f2ad723859	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	Explosive Splash	Tactical Mine Explosion Splash sparks.	5	Premium	2	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
39d17f93-e145-4da3-af5b-c48910911fe7	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	\N	Tactical Mine explodes twice, on the 2nd blast Range +100%.	3	Core	3	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
8061a67b-01a3-4b37-b663-c3ebb0af470c	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	Protection Tactics	Throws 3 Tactical Mines when reloading.	3	Premium	4	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
c637685c-fcd5-4326-8d4e-8736a1382d4e	\N	b537a74b-6cfc-4495-87b8-c01e8f46438e	Kill Tactics	Small chance to drop 1 Tactical Mine when killing an enemy.	3	Premium	5	fcc5b73f-edf4-43b9-b134-63db939ffd1d	f
01cf1f40-d65c-49b9-8071-d9e6c18d3bad	\N	\N	DMG Boost	DMG +60%	1	Normal	4	fcc5b73f-edf4-43b9-b134-63db939ffd1d	t
e55d95d5-213f-4c36-abeb-b707476ddc8a	\N	\N	Range Boost	Sweep Range +50%	1	Normal	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
e7ceeef0-36aa-427e-bb29-92f24119d38f	\N	e55d95d5-213f-4c36-abeb-b707476ddc8a	Range Boost	Sweep Range +50%	1	Normal	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
55eedc42-cc6a-493c-890d-bef4600c6d54	\N	e55d95d5-213f-4c36-abeb-b707476ddc8a	Range Boost	Sweep Range +100%	1	Premium	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
c7969a21-7d44-4917-a7fd-f16db05a10ec	\N	\N	\N	Golden Staff enlarges. Sweep Range +100%, DMG +50%.	1	Core	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
f8f52b54-3ae0-4163-a97e-253b807615d7	\N	\N	Link – Fire Blast	[Wukong] 50% chance to summon 3 Small Fireballs when attacking.	1	Premium	2	fd325003-20ee-4234-a92a-d50d95357e9b	f
bfbdba47-3892-40fd-982f-14c69980a381	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
1607f480-b72e-4282-964e-95ffb2280213	\N	bfbdba47-3892-40fd-982f-14c69980a381	Projectile Boost	Projectile +1	1	Normal	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
ffbaa6bc-116e-4136-b863-6f039dc015d5	\N	bfbdba47-3892-40fd-982f-14c69980a381	Projectile Boost	Projectile +2	1	Premium	1	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
68702cf6-4538-403f-9ee5-9f6710d5f5d9	\N	\N	Link – Qinggang	Spear Flares have a small chance to trigger Shadow Sword Barrage on hit.	1	Premium	1	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
f72d9b9e-ae38-4dd6-986c-3aa3dbd0ea57	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
8b600fda-a504-444a-9e1c-1fe2fac952aa	\N	f72d9b9e-ae38-4dd6-986c-3aa3dbd0ea57	Projectile Boost	Projectile +1	1	Normal	0	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
0c83332f-13d4-4a9d-a59e-5239220eb064	\N	f72d9b9e-ae38-4dd6-986c-3aa3dbd0ea57	Projectile Boost	Projectile +2 Reload Speed +50%	1	Premium	1	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
7dfe255b-761d-4d6a-819f-c33b1d0193ee	\N	\N	Crossover - King	20% chance to fire an alloy bullet on each shot	1	Premium	1	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
0e7eabb3-253d-4ec1-9173-ecae93e78ff7	\N	\N	\N	Fire rate +100%, Continues Fire +2 per shot.	1	Core	2	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
ce58a0e8-bfc0-4e49-a759-934ec2c034dc	\N	\N	Thunder Blade	15% chance to summer a Thunder Blade on hit.	1	Premium	3	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
ed1bd9b4-ec44-4a2c-aeb5-70647ceb3225	\N	ce58a0e8-bfc0-4e49-a759-934ec2c034dc	Thunder Blade DMG Boost	Thunder Blade DMG +50%	1	Normal	0	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
49f4ea2a-c82e-4b40-8113-622f4ceaf089	\N	\N	Explosive Thunder Blade	Thunder Sword explodes instead or disappearing	1	Premium	4	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
23ac0503-b8c7-4c7a-ab05-616c5a122c3b	\N	\N	Bigger Thunder Blade	Thunder Bald Size +50%	1	Normal	5	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
401aceb9-d563-4db8-95e2-2e25042f34d2	\N	\N	Lightning Shot	Every 6 shots, summon several Lightning Bolts around you	1	Premium	6	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
1112d9db-92bf-4b09-90ca-4d80da3d0399	\N	401aceb9-d563-4db8-95e2-2e25042f34d2	Lightning DMG Boost	Lightning DMG +50%	1	Normal	0	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
2df2f94f-0eb6-4fb1-bb61-1c96c5de4faa	\N	401aceb9-d563-4db8-95e2-2e25042f34d2	Bigger Lightning	Lightning Range +50%	1	Normal	1	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
f6f214ac-c016-453f-827d-6c226f83776d	\N	401aceb9-d563-4db8-95e2-2e25042f34d2	Thunder and Lightning	Lightning Count +100%	1	Premium	2	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
b0902edd-2fda-48a2-9151-9564e3495ae1	\N	\N	Optimus Tank	Transform into Optimus Tank, greatly increasing Attack Speed and Movement Speed for 10s. 50s CD.	5	Premium	7	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
b8307e74-cd24-4869-b141-97d3cdcef81f	\N	b0902edd-2fda-48a2-9151-9564e3495ae1	Overload Bombardment	Optimus Tank initial DMG +300%, then -30% per second	1	Premium	0	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
8697e5a9-1e2a-49ff-b978-7c6eb9fb9093	\N	b0902edd-2fda-48a2-9151-9564e3495ae1	Explosive Bombardment	Optimus Tank's first bullet of each shot triggers a large explosion on hit.	1	Premium	1	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
8eb51ece-c08f-4065-a18a-a7b9ac005f59	\N	b0902edd-2fda-48a2-9151-9564e3495ae1	Tank Maintenance	After Optimus Tank mode ends, gain a Shield equal to 15% of Max HP.	1	Normal	2	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
718ae323-8b1b-4a01-ad9d-c99dca0f16b9	\N	b0902edd-2fda-48a2-9151-9564e3495ae1	\N	Optimus Tank is guaranteed to Crit Hit, and Crit Hit DMG +100%	1	Core	3	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	f
d53e34be-1e5b-45cb-84e3-f88527c45c50	\N	\N	DMG Boost	DMG +60%	1	Normal	8	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	t
1eada282-6c01-4a49-b813-132416dea0c1	\N	\N	Phantom Boost	Release 3 Phantom Thunder every 15 shots.	1	Premium	2	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
0025a39c-1170-4f9e-82d5-0ae1361ebd65	\N	1eada282-6c01-4a49-b813-132416dea0c1	DMG Boost	Phantom DMG +50%	1	Normal	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
fb62d1a6-cabc-4b97-8e10-d580a0537b4a	\N	1eada282-6c01-4a49-b813-132416dea0c1	Phantom Boost	Phantom +2	1	Premium	1	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
93482c57-691e-405e-aa48-324a91b3e1f5	\N	1eada282-6c01-4a49-b813-132416dea0c1	\N	Phantom Thunder DMG +100%, can lock onto targets.	1	Core	2	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
b34bb62e-96a6-446f-88f5-ac6caf3d5a4e	\N	\N	Divine Thunder Dragon	Spear tip hitting enemies has 8% chance to trigger Divine Thunder.	3	Premium	3	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
e101f3b9-b1ff-4594-9f44-b20c62b8a1d4	\N	b34bb62e-96a6-446f-88f5-ac6caf3d5a4e	DMG Boost	Divine Thunder DMG +50%	3	Normal	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
a24b8f8c-3b92-4ef4-b7b5-406cf5f5f4d4	\N	b34bb62e-96a6-446f-88f5-ac6caf3d5a4e	Chance Boost	Divine Thunder trigger chance increased to 16%.	3	Premium	1	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
382e941a-6a58-4e8d-ab3c-30b712048895	\N	b34bb62e-96a6-446f-88f5-ac6caf3d5a4e	Range Boost	Divine Thunder Range +50%	3	Normal	2	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
3321d6dd-91e6-43eb-a4e4-bd4004df1b19	\N	\N	Thunder Domain	Deploys a battle banner every 20s, creating a Thunder Domain that damages enemies within range.	3	Premium	4	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
dbe27696-0004-492e-aaf6-86744368f5da	\N	3321d6dd-91e6-43eb-a4e4-bd4004df1b19	Range Boost	Thunder Domain Range +50%	3	Normal	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
51ac1ee7-a78c-4222-b817-c6c70f7a7241	\N	3321d6dd-91e6-43eb-a4e4-bd4004df1b19	DMG Boost	Thunder Domain DMG +50%	3	Normal	1	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
eacc9e7f-46b8-411e-892a-f561cb6d7cd4	\N	3321d6dd-91e6-43eb-a4e4-bd4004df1b19	Domain Extension	Thunder Domain Duration +50%	3	Normal	2	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
222849a9-5797-426f-bb28-8a99b27e97bc	\N	3321d6dd-91e6-43eb-a4e4-bd4004df1b19	\N	Thunder Domain Range +50%, DMG +200% when inside the domain.	3	Core	3	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
ff50422a-e558-4bf4-8478-30d410180825	\N	\N	Attack Paralysis	All attacks have 20% chance to apply Paralysis.	5	Premium	5	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
4cae8f09-5992-4a80-acfb-ea747008452e	\N	ff50422a-e558-4bf4-8478-30d410180825	Paralysis DMG Boost	DMG to paralyzed enemies +150%	5	Premium	0	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	f
ff7cd6bc-42dd-4796-bc38-56a3346ab566	\N	\N	DMG Boost	DMG +60%	1	Normal	6	c87b03b8-4d8a-4c92-b8f6-164d8a070a0b	t
9aca9d98-06de-415a-bd5a-79843c3fcfcf	\N	\N	Projectile Boost	Projectile +2	1	Normal	0	59b82669-b886-4616-947c-94d1ec436774	f
08576832-7b15-4b77-b4a2-44a2659c40a1	\N	9aca9d98-06de-415a-bd5a-79843c3fcfcf	Projectile Boost	Projectile +2	1	Normal	0	59b82669-b886-4616-947c-94d1ec436774	f
a860c4e0-9d85-4c4f-8932-00ddd4ae50b5	\N	9aca9d98-06de-415a-bd5a-79843c3fcfcf	Chilling Tone	Projectile +4, Penetration +1	1	Premium	1	59b82669-b886-4616-947c-94d1ec436774	f
8eef6439-b63f-492e-8470-4b7adcb64c42	\N	\N	DMG Boost	20% chance to create a Spreading Sound Wave on hit	1	Premium	1	59b82669-b886-4616-947c-94d1ec436774	f
56ad1151-943b-46a8-bc0e-9101bb6736a0	\N	8eef6439-b63f-492e-8470-4b7adcb64c42	Projectile Boost	Spreading Sound Wave lasts for 2s	1	Premium	0	59b82669-b886-4616-947c-94d1ec436774	f
edfec27a-74de-496a-b3a3-eef7be3bdda3	\N	8eef6439-b63f-492e-8470-4b7adcb64c42	Spreading Sound Wave	Spreading Sound Wave DMG to minions +100%	1	Normal	1	59b82669-b886-4616-947c-94d1ec436774	f
a20b3c1c-5a11-4b3b-a1d2-020a94825cae	\N	8eef6439-b63f-492e-8470-4b7adcb64c42	\N	Spreading Sound Wave Range +50%, triggers 2 times in a row	1	Core	2	59b82669-b886-4616-947c-94d1ec436774	f
2e997a1d-1eb2-4e42-a6ac-1c7f98d3e7db	\N	\N	Crossover – Melody	[All-round Idol] [Neon Speaker] has a 30% chance to trigger an additional sonic boom on enemy kills	1	Premium	2	59b82669-b886-4616-947c-94d1ec436774	f
0aec62e3-b71c-4a07-b839-a5b5591f7030	\N	\N	Multi-Hit	30% chance to create 3 Vibrato Notes on hit	3	Premium	3	59b82669-b886-4616-947c-94d1ec436774	f
0001b377-2a1a-4486-ad29-e658ab8bbcec	\N	0aec62e3-b71c-4a07-b839-a5b5591f7030	CD Reduction	Vibrato Note Count +3	3	Premium	0	59b82669-b886-4616-947c-94d1ec436774	f
e90615ba-d89f-4a4f-9b50-1d3250a93fa8	\N	0aec62e3-b71c-4a07-b839-a5b5591f7030	DMG Boost	Vibrato Note DMG +50%	3	Normal	1	59b82669-b886-4616-947c-94d1ec436774	f
77c0dee9-7e09-4ebe-b12b-726c5f03614b	\N	\N	Continuous Spread	Releases a High Note every 16s, dealing DMG to up to 10 nearby enemies	3	Premium	4	59b82669-b886-4616-947c-94d1ec436774	f
08679a27-7986-4a73-86ae-8b23df91ba29	\N	77c0dee9-7e09-4ebe-b12b-726c5f03614b	Sound Wave Suppression	High Note Targets +5	3	Premium	0	59b82669-b886-4616-947c-94d1ec436774	f
af640d1a-0c7c-4639-8aeb-52c7e38e7821	\N	77c0dee9-7e09-4ebe-b12b-726c5f03614b	High Note	High Note CD Speed +100%	3	Premium	1	59b82669-b886-4616-947c-94d1ec436774	f
bc30fb2c-445d-4c2f-bfa2-0dcbdb2a1e96	\N	77c0dee9-7e09-4ebe-b12b-726c5f03614b	DMG Boost	High Note DMG +50%	3	Normal	2	59b82669-b886-4616-947c-94d1ec436774	f
4e6c57cd-8b5b-4e08-89df-039dfc716b6a	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Fire Explosion	50% chance to trigger explosion upon hitting enemy	5	Premium	6	\N	f
a5c619a6-e953-41d7-b0ac-e2adaa08327d	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Continuous Fire	Continuous Fire +1.	1	Normal	0	\N	f
d369b763-d028-4720-8ca9-75278be0285e	139a7212-ab3e-4172-95c3-e0e7dfb4782f	a5c619a6-e953-41d7-b0ac-e2adaa08327d	Continuous Fire	Continuous Fire +1.	1	Normal	0	\N	f
2a764079-6cc9-432a-876e-567f9eab99ae	139a7212-ab3e-4172-95c3-e0e7dfb4782f	d369b763-d028-4720-8ca9-75278be0285e	Continuous Fire	Continuous Fire +2, targeting speed increased.	1	Premium	0	\N	f
0d2cdcbe-00dc-4374-95a1-7e2e05819b8d	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	\N	Continuous Fire x2.	1	Core	1	\N	f
78474b41-ec3c-4064-9035-281d8d57acaf	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	\N	Evolve into the Divine Punishment Railgun, damage +100%, explosion.	1	Core	2	\N	f
c4e030cf-9f6b-4056-b913-f39c41c3a16b	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Scorched Trail	Explosion leaves a trail that burns enemies.	1	Premium	3	\N	f
f4202deb-179b-4d81-8860-2f8ae412dedb	139a7212-ab3e-4172-95c3-e0e7dfb4782f	c4e030cf-9f6b-4056-b913-f39c41c3a16b	Continuous Burn	Burning duration +2s.	1	Premium	0	\N	f
0020218a-82a6-4d8c-8fc1-a77fbdfb5f9c	139a7212-ab3e-4172-95c3-e0e7dfb4782f	c4e030cf-9f6b-4056-b913-f39c41c3a16b	Relentless Burn	Burn Frequency +50%.	1	Normal	1	\N	f
44585e79-988e-42f9-b229-42f790b8adb6	139a7212-ab3e-4172-95c3-e0e7dfb4782f	c4e030cf-9f6b-4056-b913-f39c41c3a16b	Savage Burn	Burn DMG +50%.	1	Normal	2	\N	f
eac5ae14-2364-437c-b08f-e96e5c0e638b	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Link – Bow&Arrow	When the [Orbital Railgun] strikes enemies, there is a small chance to replenish 1 arrow for [Flame Feather Archer] and increase firing speed by 10% (up to 100%).	1	Premium	4	\N	f
e39506ee-821c-424c-a25c-fb3256d325a1	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Stellar Spray	Activate Stellar Spray to scan an area and bombard detected enemies. Cooldown: 30s.	3	Premium	5	\N	f
011b9d1f-044a-4744-a4bf-8e4f57f5b11d	139a7212-ab3e-4172-95c3-e0e7dfb4782f	e39506ee-821c-424c-a25c-fb3256d325a1	Spray DMG Boost	Celestial Barrage damage +50%.	3	Normal	0	\N	f
e18ccdc7-f405-475b-97af-18745bfbb62e	139a7212-ab3e-4172-95c3-e0e7dfb4782f	e39506ee-821c-424c-a25c-fb3256d325a1	Intense Spray	Celestial Barrage range +50%.	3	Normal	1	\N	f
c127acc9-fdb1-463c-9f4d-ca85ea22d29f	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Explosive Boost	Explosion Range +50%.	3	Normal	6	\N	f
00443d52-9aa3-484a-9e30-5eb1ae2d63a1	139a7212-ab3e-4172-95c3-e0e7dfb4782f	c127acc9-fdb1-463c-9f4d-ca85ea22d29f	Explosive Boost	Explosion Range +100%.	3	Premium	0	\N	f
d5c25b1e-30e1-441c-a6b1-62636df89b90	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Skyfall Strike	For every 30 enemies killed, strike the nearby ground once.	5	Premium	7	\N	f
3cd2c1f6-e4a1-46d1-a79e-b42bf73ab1e1	139a7212-ab3e-4172-95c3-e0e7dfb4782f	d5c25b1e-30e1-441c-a6b1-62636df89b90	Persistent Strike	Changed to trigger a strike every 20 kills.	5	Normal	0	\N	f
ed2da822-db22-45e8-9d25-6d9ef34d4813	139a7212-ab3e-4172-95c3-e0e7dfb4782f	d5c25b1e-30e1-441c-a6b1-62636df89b90	Intense Strike	Strike locations increase by half.	5	Normal	1	\N	f
12e70577-06fe-4bd2-9e8e-a15043239cc8	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Hyper Penetration	Orbital Cannon DMG increases with more enemies hit in a single strike (+15% per enemy, max 150%).	5	Premium	8	\N	f
e486fb30-17a0-4aad-b1fc-00e1306f86b5	139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	DMG Boost	DMG +60%	1	Normal	9	\N	t
56f89c6d-2f64-4d01-918b-22fb21127b25	\N	6e00673f-76fa-494c-8d75-2a90e5aa028f	Supply Magazine	Mag +2	1	Premium	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
72a81a17-40cb-4d22-afb6-01fe6d8257ab	\N	77c0dee9-7e09-4ebe-b12b-726c5f03614b	\N	High Note Targets +10, applies 20% Vulnerability	3	Core	3	59b82669-b886-4616-947c-94d1ec436774	f
d6cd0fe5-cc01-4724-b7f2-4e37b3906f36	\N	\N	Vibrato	Every 5 attacks releases a Chilling Vibrato, 50% chance to freeze enemies	5	Premium	5	59b82669-b886-4616-947c-94d1ec436774	f
1e0b359a-1880-4cc1-bab5-8cd5b2cd2e49	\N	d6cd0fe5-cc01-4724-b7f2-4e37b3906f36	Extreme Vibrato	Chill Vibrato Freeze chance increased to 100%	5	Normal	0	59b82669-b886-4616-947c-94d1ec436774	f
27f46f27-fa91-4f7a-895a-245541a75e17	\N	\N	DMG Boost	DMG +60%	1	Normal	6	59b82669-b886-4616-947c-94d1ec436774	t
ef0c4cf3-b55f-4b1e-9c6a-20a10c5f6536	\N	\N	Staff Attack	Every 4 attacks, throws 5 Golden Staffs at nearby enemies.	3	Premium	3	fd325003-20ee-4234-a92a-d50d95357e9b	f
bfd3830f-d28e-42da-ab4f-8ec659089aeb	\N	ef0c4cf3-b55f-4b1e-9c6a-20a10c5f6536	DMG Boost	Golden Staff DMG +50%	3	Normal	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
ce4f5ab0-73fd-4d8d-8f10-a275eebd1f16	\N	ef0c4cf3-b55f-4b1e-9c6a-20a10c5f6536	Range Boost	Golden Staff Range +50%	3	Normal	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
f3622db6-a775-4853-a263-212636be3fc9	\N	ef0c4cf3-b55f-4b1e-9c6a-20a10c5f6536	Increased Quantity	Golden Staff +2	3	Normal	2	fd325003-20ee-4234-a92a-d50d95357e9b	f
92f8f0a4-1ead-47c5-b843-e897144b6eab	\N	\N	Summon Clone	Every 20s, summon 2 clones that continuously attack enemies.	3	Premium	4	fd325003-20ee-4234-a92a-d50d95357e9b	f
9448d759-9158-4e2e-a41a-d97537d8f6df	\N	92f8f0a4-1ead-47c5-b843-e897144b6eab	Increased Quantity	Clone +2	3	Premium	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
3e81eab7-4357-462b-83cc-6038b4f1f4fe	\N	92f8f0a4-1ead-47c5-b843-e897144b6eab	DMG Boost	Clone DMG +50%	3	Normal	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
e6e34408-999d-4e62-880c-411c6a7e10cd	\N	92f8f0a4-1ead-47c5-b843-e897144b6eab	\N	Create heavenly havoc, increasing Clone Quantity +100%	3	Core	2	fd325003-20ee-4234-a92a-d50d95357e9b	f
94c6165b-cccb-4f57-98b7-b9cc24f5f7d7	\N	\N	Mighty Staff Slam	5% chance to smash down a giant Golden Staff on enemy kill.	5	Premium	5	fd325003-20ee-4234-a92a-d50d95357e9b	f
eca72a60-591b-4c93-8933-6804d88350e7	\N	94c6165b-cccb-4f57-98b7-b9cc24f5f7d7	DMG Boost	Giant Golden Staff DMG +50%	5	Normal	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
e9b2e745-f6b8-4790-8d1b-127f2b933b49	\N	94c6165b-cccb-4f57-98b7-b9cc24f5f7d7	Increased Chance	Giant Golden Staff trigger chance doubled.	5	Premium	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
39f8ce18-635a-430b-8690-a69038f09e5e	\N	\N	Protective Fire Ring	When zombie hordes come, creates a fire ring that reduces enemy speed by 50% for 20s.	1	Premium	6	fd325003-20ee-4234-a92a-d50d95357e9b	f
f05d2d89-da30-4148-9705-6fddd4773767	\N	39f8ce18-635a-430b-8690-a69038f09e5e	Defensive Counter	Inside the Fire Ring, Attack Speed +50%, Reload Speed +50%.	1	Normal	0	fd325003-20ee-4234-a92a-d50d95357e9b	f
c79380a1-1201-4fef-8dbd-619251587314	\N	39f8ce18-635a-430b-8690-a69038f09e5e	Immolate	Fire Ring hits inflict Immolation.	1	Normal	1	fd325003-20ee-4234-a92a-d50d95357e9b	f
7ac5e303-4140-40f6-ae80-c112cc45c83e	\N	\N	DMG Boost	DMG +60%	1	Normal	7	fd325003-20ee-4234-a92a-d50d95357e9b	t
367e60ef-0358-4a74-b9b5-8842ec965f59	\N	6e00673f-76fa-494c-8d75-2a90e5aa028f	Crystal Burst	Mag +2, Crystal +3	1	Premium	1	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
6d169c4d-0dbb-40f2-b470-0d30edf65c85	\N	6e00673f-76fa-494c-8d75-2a90e5aa028f	Crossover – Crystal Diamond	Small chance to generate Warp Light Path on attack	1	Premium	2	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
40d6b900-096d-4828-bce4-cede82db740e	\N	\N	\N	Fire Rate +100%, Continuous Fire Count +100%	1	Core	1	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
74ca4abe-7170-4493-8aa2-32b1c0cc5229	\N	\N	Gem Array	Every 10 shots, trigger Gem Array Bombardment.	1	Premium	2	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
34a4021a-27dd-421f-ae04-04fe8ff08fd8	\N	74ca4abe-7170-4493-8aa2-32b1c0cc5229	Array Boost	Gem Array +1 Row	1	Premium	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
393c6011-6323-4f41-83e4-cdefcedc3334	\N	74ca4abe-7170-4493-8aa2-32b1c0cc5229	Range Boost	Gem Array Range +50%	1	Normal	1	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
093515e4-beca-477b-931f-94c4bb752e54	\N	74ca4abe-7170-4493-8aa2-32b1c0cc5229	DMG Boost	Gem Array DMG +50%	1	Normal	2	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
da441c85-3c07-4515-b431-f3ff6bc1fb1f	\N	74ca4abe-7170-4493-8aa2-32b1c0cc5229	\N	Gem Array +1 Row, DMG +100%	1	Core	3	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
219dc78b-668d-490a-a7cd-f3edb205b0ac	\N	\N	Splash Crystal	20% chance to generate 2 extra Crystal on hit.	3	Premium	3	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
a7b634b1-73ce-4cdf-b112-d4b11953fed1	\N	219dc78b-668d-490a-a7cd-f3edb205b0ac	Chance Boost	Increases the chance of gaining extra Crystal Diamonds on hit to 30%.	3	Normal	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
f7833909-38aa-4e21-8b62-30b097b3a644	\N	219dc78b-668d-490a-a7cd-f3edb205b0ac	Count Boost	Grants +1 extra Crystal Diamond on hit.	3	Normal	1	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
245b20f8-ad10-4d87-a2a0-df62774f53b0	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Projectile Boost	Projectile +1	1	Normal	0	\N	f
836e77b8-d541-4040-8948-202c9feb3754	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	245b20f8-ad10-4d87-a2a0-df62774f53b0	Projectile Boost	Projectile +1	1	Normal	0	\N	f
c1f59341-b81d-4d07-9ac0-bdb4eb6a21bd	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	836e77b8-d541-4040-8948-202c9feb3754	Projectile Boost	Every 2 shots, next projectile +6	1	Premium	0	\N	f
95c743cb-022d-4741-9b7e-13c45c9e7229	\N	\N	Crystal Storm	Launches Crystal Radiance Storm. Cooldown: 30s.	3	Premium	4	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
a1ee853a-c64a-44e6-9e1c-6495150f6cdf	\N	95c743cb-022d-4741-9b7e-13c45c9e7229	Crystal Cooldown	Every 20 kills, Crystal Storm CD Speed +1% (Max 100%).	3	Premium	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
c08deda5-13d2-4f20-a86a-fcead19b736f	\N	95c743cb-022d-4741-9b7e-13c45c9e7229	Crystal Delay	Crystal Storm Duration +50%	3	Normal	1	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
1cd3ee5b-efe6-4980-a402-893fa4502c05	\N	95c743cb-022d-4741-9b7e-13c45c9e7229	Crystal Bloom	Crystal Storm DMG Density +100%	3	Premium	2	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
7e68cc4f-f7f3-48a9-b7ea-85af248cc65e	\N	\N	Fire Rate Boost	Fire Rate +60%	5	Normal	5	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
55a4f2e8-8f38-49f1-a22b-5aee2dd76ef9	\N	7e68cc4f-f7f3-48a9-b7ea-85af248cc65e	Fire Rate Boost	Fire Rate +100%, Reload Speed +50%	5	Premium	0	c81bf534-9d83-4d4c-9b03-f32864658f5f	f
ffc8e932-e51d-43d6-b7c5-55b3193556f9	\N	\N	DMG Boost	DMG +60%	1	Normal	6	c81bf534-9d83-4d4c-9b03-f32864658f5f	t
d0f04091-9680-4af4-81e3-9bf99771a95a	\N	\N	Continuous Fire	Continuous Fire +1.	1	Normal	0	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
bce7290d-7bdd-4f3c-a693-20f7205ead68	\N	d0f04091-9680-4af4-81e3-9bf99771a95a	Continuous Fire	Continuous Fire +1.	1	Normal	0	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
ddac981b-c796-4ccf-a53f-a590bd7fd68f	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	245b20f8-ad10-4d87-a2a0-df62774f53b0	\N	Projectile x2, DMG +50%	1	Core	1	\N	f
bfa1d50d-3db8-4c0a-804c-32f271457228	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Zap Zone	First hit on enemy creates a Zap Zone	1	Premium	1	\N	f
ba18fe50-a2bb-4c00-8a93-52c3af571128	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	bfa1d50d-3db8-4c0a-804c-32f271457228	\N	Evolves into Positive Thunder. Zap Zone DMG +150%	1	Core	0	\N	f
a2a5e006-45e9-4a49-a4e4-2acba65b1d27	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	bfa1d50d-3db8-4c0a-804c-32f271457228	Paralyzing Zap Zone	Zap Zone has a 50% chance to paralyze enemies	1	Normal	1	\N	f
af559612-2989-4542-900f-3aa6ad3c9413	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	bfa1d50d-3db8-4c0a-804c-32f271457228	Zap Zone DMG Boost	Zap Zone DMG +50%	1	Normal	2	\N	f
dfcf7d9b-d8e7-4677-82b4-ad47d5c77a48	\N	\N	Frost Amplifier	Ice Spray Range +50%	3	Normal	3	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
5fdc5e8a-f4ba-4760-89bf-32eca3919868	\N	dfcf7d9b-d8e7-4677-82b4-ad47d5c77a48	Frost Amplifier	Ice Spray Range +100%	3	Premium	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
1b0bac4f-0982-4241-8fe6-c7e1de99ca6b	\N	\N	Freeze Explosion	10% chance to create 1 Ice Burst when triggering Freeze	3	Premium	4	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
8d4f4922-0209-488f-91e2-95377b688c06	\N	1b0bac4f-0982-4241-8fe6-c7e1de99ca6b	Ice Burst DMG Boost	Ice Burst DMG +50%	3	Normal	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
6ff75377-3f1b-40ff-9289-25f7e6f2fcd9	\N	1b0bac4f-0982-4241-8fe6-c7e1de99ca6b	Ice Burst Amplifier	Ice Burst Range +50%	3	Normal	1	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
cd834138-0c89-47c7-8219-cf91706d2b8f	\N	\N	Weakening Freeze	Enemies become Weakened when frozen, DMG -30% for 3s. Weakened effect does not stack.	5	Premium	5	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
6343e6bc-3297-4294-bb30-ef0062b8c932	\N	\N	Extreme Cold Ice Spike	Killing a Frozen Enemy Has a 100% Chance to Leave an Ice Spike	5	Premium	6	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
3c9e0233-10f7-4203-8247-bf778d145036	\N	6343e6bc-3297-4294-bb30-ef0062b8c932	Delayed Spike	Ice Spike Duration +2s	5	Normal	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
5ae83869-1995-4f67-879c-d762c947380b	\N	6343e6bc-3297-4294-bb30-ef0062b8c932	Spike Amplifier	Ice Spike Size +50%	5	Normal	1	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
1c7e9cf6-d151-4777-8351-b496358d0704	\N	6343e6bc-3297-4294-bb30-ef0062b8c932	\N	Ice Spike Size +50%, Damage +100%	5	Core	2	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
b7f427e5-7ab6-4dac-b268-9794e7b9ed86	\N	\N	DMG Boost	DMG +60%	1	Normal	7	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	t
08bd6c84-505e-47b4-abd4-f934be5d0632	df3a5eba-ed30-4368-bce7-859f54bc2274	4e6c57cd-8b5b-4e08-89df-039dfc716b6a	Fire Blast Amplification	Explosion Range +50%	5	Normal	0	\N	f
3b63e257-a6bd-44d8-9b86-2f01ceb1ee76	df3a5eba-ed30-4368-bce7-859f54bc2274	4e6c57cd-8b5b-4e08-89df-039dfc716b6a	Fire Blast DMG Boost	Explosion DMG +50%	5	Normal	1	\N	f
88fd38b7-2af7-40e3-8da5-7ed44a8ec1c2	df3a5eba-ed30-4368-bce7-859f54bc2274	\N	DMG Boost	DMG +50%	1	Normal	7	\N	t
e0d5485b-6122-42b5-8c91-d1b5714afde1	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Continuous Fire	Continuous Fire +1.	1	Normal	0	\N	f
4970ec90-64a3-4c5f-8b61-01e3e2e6acc4	a70d3aa7-d788-4cde-a745-df842ccb4b6e	e0d5485b-6122-42b5-8c91-d1b5714afde1	Continuous Fire	Continuous Fire +1.	1	Normal	0	\N	f
58cd2456-9857-40fe-bedc-09c8e0e8cef9	a70d3aa7-d788-4cde-a745-df842ccb4b6e	4970ec90-64a3-4c5f-8b61-01e3e2e6acc4	Double Continuous Fire	Continuous Fire x2.	1	Premium	0	\N	f
e332833a-055f-435d-a80d-a862f20f96b3	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	\N	Evolve into Super Rocket, DMG +120%, Explosion Range +120%.	1	Core	1	\N	f
a90bb9a7-f48f-471c-98e4-550be03b6720	a70d3aa7-d788-4cde-a745-df842ccb4b6e	e332833a-055f-435d-a80d-a862f20f96b3	\N	Evolve to Ultimate Rocket, Headshot Rate +10%.	1	Core	0	\N	f
433c59d5-5769-465a-90c2-6d3174c06da1	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Link – Judgement	Fire Judgment DMG +120%, Judgment Cannon DMG +120%.	1	Premium	2	\N	f
21a65e97-73df-463c-bda0-478d0da3d8a6	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Explosion DMG Boost	Rocket Launcher and Explosive Spark DMG +100%.	1	Premium	3	\N	f
d7b8c104-5d84-4b13-a4f4-70711308715e	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Explosive Sparks	Kill an enemy to split 3 Explosive Sparks.	1	Premium	4	\N	f
18aad375-ae93-411f-9a66-dd082afda1ea	a70d3aa7-d788-4cde-a745-df842ccb4b6e	d7b8c104-5d84-4b13-a4f4-70711308715e	Slow Spark	Explosive Spark applies slow effect.	1	Normal	0	\N	f
7ef06a69-3c7b-4d1c-b37c-22d1f3b7e351	\N	\N	Mag Boost	Mag +4, Fire Rate +25%	1	Normal	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
b281208f-bd90-49b8-98dc-2d2b3b62e0b3	\N	7ef06a69-3c7b-4d1c-b37c-22d1f3b7e351	Mag Boost	Mag +4, Fire Rate +25%	1	Normal	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
046bf382-5e3d-4a47-80f9-04be74756c8c	\N	7ef06a69-3c7b-4d1c-b37c-22d1f3b7e351	Mag Boost	Mag +8, Fire Rate +50%	1	Premium	1	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
b5023f04-35ce-4a03-80b1-52ab60aebfa2	\N	\N	\N	25% chance to trigger a secondary explosion when missile explodes.	1	Core	1	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
ecb58577-dce0-4673-9f65-de632cdb9289	\N	\N	Focused Shot	Every 30 shots, trigger Focused Shot.	1	Premium	2	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
f7ae3984-ddb3-4dee-94a5-9ed73d1fd542	\N	ecb58577-dce0-4673-9f65-de632cdb9289	Fire Rate Boost	Every 5 Focused Shots, Fire Rate +15%, Reload Speed +15%, max 150%.	1	Premium	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
a07442ab-cd45-4eb5-a893-e85ef9de5c14	\N	\N	Missile Stun	Missiles have a 20% chance to stun enemies.	1	Premium	3	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
9619e751-5124-4d41-a0f6-9ae16cb762db	\N	\N	Link – Scorching Flame	Missile hits have a 10% chance to generate a Fireball	1	Premium	4	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
d94c85b4-17e9-4309-a8af-9778a5cd766e	\N	\N	Abyss Boost	Every 30s gain Abyssal Boost: DMG +150%, lasts 15s. Shared with 1 nearby friendly Player.	3	Premium	5	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
fe6afc1e-9337-4651-8110-7052903c47a4	\N	d94c85b4-17e9-4309-a8af-9778a5cd766e	DMG Boost	Whenever Abyssal Boost is active, Mech DMG +20%, max 100%.	3	Premium	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
0d61d22a-c6ce-4928-81e8-0c0ecd6dd370	\N	d94c85b4-17e9-4309-a8af-9778a5cd766e	DMG Boost	After gaining Abyssal Boost, DMG +50%, Mag +4, lasts 15s.	3	Normal	1	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
b8cf7074-85f5-4ddb-9e6d-15174f935d03	\N	d94c85b4-17e9-4309-a8af-9778a5cd766e	Fire Rate Boost	After gaining Abyssal Boost, Fire Rate +50%, Reload Speed +50%, lasts 15s.	3	Normal	2	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
4b916878-4c96-446d-ae42-ae52e3cc1daa	\N	\N	Explosive Missile	Every 4 shots, gain 1 Explosive Missile, all Explosive Missiles are fired while reloading.	3	Premium	6	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
8d40fce4-e04e-4d37-a68e-3a433d1ab706	\N	4b916878-4c96-446d-ae42-ae52e3cc1daa	DMG Boost	After Burst Bullets are fired, Mech DMG +5%, max 120%	3	Normal	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
cd0e9d60-e054-498a-8a51-1da42ac354f0	\N	4b916878-4c96-446d-ae42-ae52e3cc1daa	DMG Boost	Every 4 shots, Explosive Missile DMG +25%, resets upon reloading.	3	Premium	1	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
59129176-d268-485d-96d4-26c4d1970f29	\N	\N	Splash Missile	15% chance to produce Splash Missiles after missile hits.	5	Premium	7	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
8c95ebc3-51ca-404d-ac66-017d13727f9a	\N	59129176-d268-485d-96d4-26c4d1970f29	Range Boost	For every 20 enemies killed by Splash Missiles, Missile Explosion Range +10%, max 100%.	5	Premium	0	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
23a1dc38-7014-4572-b001-99546c22c020	\N	\N	\N	Fire two shells each time.	1	Core	1	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
9bda85df-bb08-4ffa-aee6-771076a5354b	\N	\N	\N	Grant 6 Sec of invincibility, damaging enemies upon collision (Cooldown: 30 Sec).	1	Core	2	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
dd56a207-6b95-4ba8-a387-7b10f4c3fed7	\N	\N	Trigger Fire Circle	Leaves Fire residue upon explosion.	1	Premium	3	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
51e9ebb7-ae11-425f-a43f-65dc27cd7c13	\N	dd56a207-6b95-4ba8-a387-7b10f4c3fed7	Range Boost	Remaining Fire Range +50%.	1	Normal	0	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
82234b30-91d3-420a-b738-b581d8dbaf74	\N	dd56a207-6b95-4ba8-a387-7b10f4c3fed7	Fire Circle DMG Boost	Fire Residue DMG +50%.	1	Normal	1	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
122cc6fa-6ec5-43e7-8c67-9dca5eace2e9	\N	dd56a207-6b95-4ba8-a387-7b10f4c3fed7	Burning	Fire residue inflicts burn.	1	Normal	2	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
1894f910-d5cd-41ff-9956-88f7006bb143	\N	dd56a207-6b95-4ba8-a387-7b10f4c3fed7	Fire Explosion	Fire residue erupts into a Fire Pillar when it disappears.	1	Premium	3	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
e5aa8663-7b94-4b3f-86a2-9dd60221dbb9	\N	\N	Reload Protection	Every 5 shots, Fire 10 small armor-piercing bullets into the surroundings.	5	Premium	4	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
567c0816-89a4-44d8-b8b3-7e0a88aad170	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
8227fffe-e502-4e46-833a-6397fa771d0f	\N	567c0816-89a4-44d8-b8b3-7e0a88aad170	Projectile Boost	Projectile +1	1	Normal	0	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
a952e4a3-5a72-4a66-b301-2679edd870c8	\N	567c0816-89a4-44d8-b8b3-7e0a88aad170	Projectile Boost	Projectile +2	1	Premium	1	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
0b7faf75-3efb-4085-b914-f747e3b617a0	\N	\N	Trigger Lightning	Bullet hits 15% chance to trigger lightning	1	Normal	1	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
75e4adc2-9d8f-419b-947f-31529be087be	\N	0b7faf75-3efb-4085-b914-f747e3b617a0	Lightning DMG Boost	Lightning DMG +100%	1	Normal	0	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
6f7ab765-a5b6-4be6-9328-afe6e5f38b02	\N	0b7faf75-3efb-4085-b914-f747e3b617a0	Lightning Shield	Gain shield equal to 10% max HP for every 50 times lightning is triggered	1	Premium	1	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
6eec2435-b27f-46ef-9156-829f9124002d	\N	\N	\N	Reduce DMG taken from minions by 70%	1	Core	2	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
7db68cd2-a159-49d7-8264-427eb1c73696	a70d3aa7-d788-4cde-a745-df842ccb4b6e	d7b8c104-5d84-4b13-a4f4-70711308715e	Spark Boost	Explosive Spark Size +100%.	1	Normal	1	\N	f
15b09c99-10c3-421d-b7b6-ff5cae2d54f2	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Firepower Suppression	DMG +120%.	5	Premium	5	\N	f
8e2db578-05a6-4683-958a-1d1100ffaef2	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Powerful Explosion	Explosion Range +50%.	3	Normal	6	\N	f
b785aeae-4cae-462c-a66a-2253eb97edeb	a70d3aa7-d788-4cde-a745-df842ccb4b6e	8e2db578-05a6-4683-958a-1d1100ffaef2	Explosive Stun	100% chance to stun enemies.	3	Normal	0	\N	f
95388caa-33c0-42b5-894f-9510b241035d	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Judgement	Deal 1.5x DMG to monsters with ≥ 50% Health.	5	Premium	7	\N	f
b4078650-efd6-4907-ac1d-f10ed99ed742	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	bfa1d50d-3db8-4c0a-804c-32f271457228	Zap Zone Boost	Zap Zone Range +100%	1	Premium	3	\N	f
c1ec27ea-5696-4c8c-bc13-a5e305409b28	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Thunder Superconduct	DMG +250%, Every 30 secs, decay by 50%	3	Premium	2	\N	f
5b96b207-e556-4416-ad8c-7613456129e5	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	c1ec27ea-5696-4c8c-bc13-a5e305409b28	Thunder Superconduct	CD speed +100%, Every 30 secs, decay by 20%	3	Premium	0	\N	f
b8968072-387a-4fef-9764-7614e368261b	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Bounce Boost	Bounce +1, DMG +20%	3	Normal	3	\N	f
c50f6be4-499f-429a-bf50-ae66bc5602b5	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	b8968072-387a-4fef-9764-7614e368261b	Bounce Zap Zone	Zap Zone can be re-triggered after bouncing	3	Premium	0	\N	f
f64a44c1-77e2-49c1-84a2-6980971a435a	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Crit Hit Boost	Crit Hit rate +50%	5	Premium	4	\N	f
0aae0164-50a2-4b74-9072-d58d67e74eb6	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	f64a44c1-77e2-49c1-84a2-6980971a435a	Crit DMG Boost	Crit Hit DMG +150%	5	Normal	0	\N	f
f6b9a199-6d18-41fc-bcfe-ff59d7a09964	b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	DMG Boost	DMG +60%	1	Normal	5	\N	t
2befa338-b3f9-4bc3-8d17-cba06c28182b	\N	\N	link – Thunder	Generates 3 Thunder Missiles that orbit around the Mech	1	Premium	3	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
6f4fe984-a5ee-44bd-ad47-653ab3e0cd08	\N	\N	Mag Upgrade	Mag +20, Fire Rate +20%	3	Normal	4	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
9e552d96-e373-4122-b18c-d7f8f6611dd1	\N	\N	Fire Rate Boost	Fire Rate +50%	3	Normal	5	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
f9d398ed-fdcf-45ea-b553-844836c532f4	\N	9e552d96-e373-4122-b18c-d7f8f6611dd1	Counterattack	When taking DMG, Fire Rate +5% (max 150%)	5	Premium	0	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
0f8e7949-9159-45be-aee1-8233180b7e6c	\N	\N	Giant Beast Fist	Every 20 shots summons a Heavy Punch from above	3	Premium	6	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
4f89db2d-bf61-410d-be95-ca0b5a5fdcdf	\N	0f8e7949-9159-45be-aee1-8233180b7e6c	Range Boost	Heavy Punch Range +50%	3	Normal	0	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
76b07c10-8ee9-4b67-a070-fb79014b7aed	\N	0f8e7949-9159-45be-aee1-8233180b7e6c	\N	Giant Beast Fist evolves into Thunder Heavy Fist, DMG +100%, inflicts paralysis	3	Core	1	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
bad7e0e4-4cd7-43d7-88f8-6c7fefe22c87	\N	\N	Berserk	Fire Rate +150%, Reload Speed +100%	5	Premium	7	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
74468e8e-b30f-47fb-a115-28da775b1977	\N	\N	Counterattack	Summon 3 Heavy Punches for each DMG taken	5	Premium	8	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	f
7e649043-f72e-463e-b648-626e2442c7a4	\N	\N	DMG Boost	DMG +60%	1	Normal	9	a431dd1f-3555-49b3-9a7b-d81985bc6f1e	t
e579736f-0172-412a-a84f-a732672dbf85	\N	\N	Paralyzing Shot	100% chance to paralyze enemy for 1s when hit.	1	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
90f10e18-d343-49d4-a981-99ccf7ce7489	\N	e579736f-0172-412a-a84f-a732672dbf85	Crit Hit Paralysis	When a paralyzed enemy is killed, Crit Hit Rate +1% (Max 50%).	1	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
7b872c35-9ad1-467e-b57c-8fe6f80ea79e	\N	e579736f-0172-412a-a84f-a732672dbf85	Crit DMG Paralysis	When a paralyzed enemy is killed, Crit Hit DMG +3% (Max 150%).	1	Normal	1	70a95a22-43a2-443b-b749-339a597981d8	f
4a980e5d-0910-4a16-a110-729c726c266b	\N	\N	Link – Electromagnetic	Release an Electromagnetic Coil Every 6 Attacks.	1	Premium	1	70a95a22-43a2-443b-b749-339a597981d8	f
52165199-5626-4e76-ac60-4e1b0fae56a2	\N	\N	Continuous Fire	Continuous Fire +2.	1	Normal	2	70a95a22-43a2-443b-b749-339a597981d8	f
595a5cdf-2bb1-4375-96d3-f0e27580a931	\N	52165199-5626-4e76-ac60-4e1b0fae56a2	Continuous Fire	Continuous Fire +2.	1	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
81cfd0d0-2698-47e3-9c10-7ed42c3a83b7	\N	595a5cdf-2bb1-4375-96d3-f0e27580a931	Continuous Fire	Continuous Fire +4.	1	Premium	0	70a95a22-43a2-443b-b749-339a597981d8	f
e486fd8e-5815-48e7-9402-184eb1fd3fda	\N	59129176-d268-485d-96d4-26c4d1970f29	Splash Stun	Splash Missiles have a 20% chance to stun enemies.	5	Normal	1	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
dde93536-3355-4312-be18-6a278f32ebd7	\N	\N	\N	Abyssal Missile, DMG +100%, Fire Rate +5% for each shot, resets upon reloading.	5	Core	8	eb241d37-6610-408b-afd0-3ecfdd0c33f6	f
b29ecc96-b7d2-4ed2-9284-c94ce4eded9e	\N	\N	DMG Boost	DMG +60%	1	Normal	9	eb241d37-6610-408b-afd0-3ecfdd0c33f6	t
0c5e1cad-f207-4a49-bdb5-af359e90acce	\N	\N	Range Boost	Bullet explosion Range +50%.	3	Normal	5	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
be35feca-e808-4f4e-a5db-15c39045df96	\N	\N	Range Boost	Bullet explosion Range +50%, Remaining fire Range +50%.	3	Premium	6	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
77be23e3-2384-4fdd-8ef6-bd0ca3e846c9	\N	\N	Ammo Upgrade	60% chance to stun enemies for 1.5 Sec.	5	Premium	7	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	f
8520656b-3b79-4313-88b0-bdf1926e261a	\N	\N	DMG Boost	DMG +60%	1	Normal	8	f52199d2-01b9-463d-bfdf-94c8a1d1f28f	t
7f7c18e8-cc1c-49e1-8906-403dec259329	\N	57709893-7354-47a1-bb2e-c27ab0d4badd	DMG Boost	Starlight Explosion DMG +50%	1	Normal	2	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
ffa7c6f5-1197-4b5a-9f9f-2a4dfa75142c	\N	\N	Light Shield Impact	20% chance to trigger 1 Light Shield Impact when taking damage	3	Premium	6	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
177ca9b6-88b9-48ed-850e-3c7fa476d741	\N	ffa7c6f5-1197-4b5a-9f9f-2a4dfa75142c	DMG Boost	Light Shield Impact DMG +50%	1	Normal	0	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
e214474e-85dd-4e36-9eac-0f53dee15103	\N	ffa7c6f5-1197-4b5a-9f9f-2a4dfa75142c	Power Impact	Light Shield Impact Range +50%	1	Normal	1	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
decce995-a82b-4f3b-a447-28a011c0c026	\N	ffa7c6f5-1197-4b5a-9f9f-2a4dfa75142c	Area Impact	Light Shield Impact Area +100%	1	Normal	2	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
16eaf670-bbbb-4baf-853b-5f6f1ebebcb6	\N	\N	Firearm Boost	Fire Rate +50% Mag +10	5	Normal	7	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
e2f7eb2f-1dfd-47ac-a82b-cac66869410e	\N	\N	Rapid Fire	Each shot: Fire Rate +5%, Reload Speed +5% Resets on reload	5	Premium	8	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
9521bc32-154a-434d-8325-fccf3a82b3b8	\N	\N	DMG Boost	DMG +60%	1	Normal	9	1560a1b5-ea7f-47db-8852-cdc6aaea3318	t
8d9013ba-35cf-4b4b-8154-e58205a24e17	\N	\N	Continuous Fire	Eight Shot Burst	1	Normal	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
22f19917-4aab-42a8-ba5b-3280d1cd4408	\N	8d9013ba-35cf-4b4b-8154-e58205a24e17	Continuous Fire	Fifteen Shots Burst	1	Normal	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
63d466a5-67fc-450a-a9eb-fbfb4bc7dd5f	\N	8d9013ba-35cf-4b4b-8154-e58205a24e17	Fast Shooting	Each attack increases Fire Rate by +20% (up to 300%), resets upon reloading	1	Premium	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
e8962842-cece-4beb-8164-375258c301c4	\N	\N	\N	Evolve to Extreme Cold Laser: DMG +100% with freeze effect	1	Core	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
1fe60fb1-6abb-48ef-9aae-884584c51d60	\N	\N	Laser Launcher	Every 5 attacks, deploy a laser emitter	1	Premium	2	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
995c1ddb-4f71-489f-b35c-70f295d286be	\N	1fe60fb1-6abb-48ef-9aae-884584c51d60	Projectile Boost	Laser Emitter Projectile Path increased by 100%	1	Premium	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
1b3c87a9-84da-430a-9a4a-904975ff6544	\N	1fe60fb1-6abb-48ef-9aae-884584c51d60	DMG Boost	Laser Emitter DMG +50%	1	Normal	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
41c0a291-a58b-41c0-979f-7460071be4eb	\N	\N	Wide Area Laser	Every 40 seconds, release a wide area laser that cuts through enemies within range	1	Premium	3	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
bb1b9895-df25-4b76-88c2-9e93d9acf3f3	\N	\N	Laser Split	Laser splits into 3 mini-lasers after hitting the first enemy	3	Premium	4	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
19aa0e13-e593-4eb8-b069-ed4716333e9f	\N	bb1b9895-df25-4b76-88c2-9e93d9acf3f3	Split DMG Boost	Mini-laser DMG +50%	1	Normal	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
e7d9ef03-34e3-4697-ba85-246d7161f183	\N	bb1b9895-df25-4b76-88c2-9e93d9acf3f3	Split Freezing	Mini-lasers apply freeze effects	1	Normal	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
2adb2380-2d5e-42a2-b688-8160a21c065a	\N	\N	Energy Puls	Every 8 seconds release on Energy Pulse, damaging and knocking back nearby	3	Premium	5	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
68c61e2d-2490-4d70-8525-a4c13f6d0831	\N	2adb2380-2d5e-42a2-b688-8160a21c065a	Pulse DMG Increased	Energy Pulse DMG +50%	1	Normal	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
212f9b11-982b-43d1-80f3-1755580f6333	\N	2adb2380-2d5e-42a2-b688-8160a21c065a	\N	Evolve into Supercharged Pulse, DMG +100%. The pulse lingers for 2 seconds	1	Core	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
53472a38-ba0c-4363-a98c-a1e233da59fd	\N	\N	Duration	Duration +50%	1	Normal	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
efdae517-c98e-43e6-b6d6-3853fcc8bbd0	\N	\N	Crit Hit Boost	Crit Hit Rate +35%.	1	Premium	3	70a95a22-43a2-443b-b749-339a597981d8	f
395c6ce5-2556-4242-8fc4-48f5e83e95a8	\N	efdae517-c98e-43e6-b6d6-3853fcc8bbd0	Crit Hit Flash	Release a row of Lightning Bullets after 20 Crit Hits.	1	Premium	0	70a95a22-43a2-443b-b749-339a597981d8	f
e07981ac-f225-491c-a08a-0cb09ad74b3f	\N	395c6ce5-2556-4242-8fc4-48f5e83e95a8	Flash DMG Boost	Lightning Bullets DMG +50%.	1	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
cecd8dc0-a0eb-479f-9d06-8f200ae8dea5	\N	395c6ce5-2556-4242-8fc4-48f5e83e95a8	Double Flash	Lightning Bullets Count +100%.	1	Premium	1	70a95a22-43a2-443b-b749-339a597981d8	f
0f397906-700e-49da-ace1-70aa98be4de0	\N	\N	EM Cannon	Every 5 attacks, fire 1 EM Cannon.	1	Premium	4	70a95a22-43a2-443b-b749-339a597981d8	f
a0c8c9ba-54f4-428f-ab91-7c64d24a7dc7	\N	0f397906-700e-49da-ace1-70aa98be4de0	EM Zap Zone	EM Cannon leaves behind an EM Zap Zone after disappearing.	1	Premium	0	70a95a22-43a2-443b-b749-339a597981d8	f
c430f0e0-834d-45aa-82ff-af345d582589	\N	a0c8c9ba-54f4-428f-ab91-7c64d24a7dc7	Zap Zone Explosion	Zap Zone explodes again when it disappears.	1	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
365868b7-c959-44e2-ac15-668e1326469d	\N	0f397906-700e-49da-ace1-70aa98be4de0	EM DMG Boost	EM Cannon DMG +50%.	1	Normal	1	70a95a22-43a2-443b-b749-339a597981d8	f
bf1f9e76-19e3-4323-8bd8-75b4abe7a892	\N	0f397906-700e-49da-ace1-70aa98be4de0	EM Boost	EM Cannon Range +50%.	1	Normal	2	70a95a22-43a2-443b-b749-339a597981d8	f
a063f5ac-d727-469f-8dc9-a8b9155a2787	\N	\N	Counterattack Lightning	When taking DMG, up to 5 random Lightning bolts strike within the attack range.	5	Normal	5	70a95a22-43a2-443b-b749-339a597981d8	f
f83804ed-2b47-4ae7-9b5b-30cbc9bca107	\N	a063f5ac-d727-469f-8dc9-a8b9155a2787	Double Lightning	Max Lightning Count +100%.	5	Premium	0	70a95a22-43a2-443b-b749-339a597981d8	f
efdef6de-9f15-40d6-aa69-380e3ea86033	\N	f83804ed-2b47-4ae7-9b5b-30cbc9bca107	Lightning Zap Zone	Lightning leaves a Zap Zone on the ground.	5	Normal	0	70a95a22-43a2-443b-b749-339a597981d8	f
625c93e2-67b8-4be8-9d20-f1f81f37e8e2	\N	\N	\N	When HP first drops below 50%, gain invincibility for 15s.	5	Core	6	70a95a22-43a2-443b-b749-339a597981d8	f
0176ac13-f7af-488d-b1fc-33ae25d1aa86	\N	\N	\N	Bullet Size +100%, DMG +100%.	5	Core	7	70a95a22-43a2-443b-b749-339a597981d8	f
513ff71a-4819-4119-ae10-5f66665f1762	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Continuous Thunder Spears	Thunder Spear Count +2	1	Normal	0	\N	f
0d0d0a31-781a-4b8d-bc33-e27b3e73f33f	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	513ff71a-4819-4119-ae10-5f66665f1762	Continuous Thunder Spears	Thunder Spear Count +2	1	Normal	0	\N	f
8254e4ce-83a5-4fc9-a8e9-d6f5b0f13c3a	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	0d0d0a31-781a-4b8d-bc33-e27b3e73f33f	Continuous Thunder Spears	Thunder Spear Count +50%	1	Premium	0	\N	f
6968c608-9c1f-4f4b-9a0e-7cb8be100fd7	\N	53472a38-ba0c-4363-a98c-a1e233da59fd	Duration	Duration +50%	1	Normal	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
71589378-a075-4052-9b01-951200e4b619	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	\N	Thunder Spear Count +100%	1	Core	1	\N	f
ea470721-e238-41a7-8b45-e12c9c527aba	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Delayed Thunder Spear	Thunder Spear Duration +2s	1	Premium	2	\N	f
771d4ed6-0dbc-41cd-8a5e-ddcfb721c8fd	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	ea470721-e238-41a7-8b45-e12c9c527aba	Thunder Spear Boost	Thunder Spear Size +50%	1	Normal	0	\N	f
27600904-48cc-438e-ab2a-68b212c04592	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Surging Thunder	Thunder Spear continuously releases Shockwaves	1	Premium	3	\N	f
19e8c563-6f2a-4409-a7a4-d0ca5eab30d0	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Thunder Spear Explosion	Thunder Spear explodes again when it disappears	1	Premium	4	\N	f
251ae19c-dc51-4a35-ac50-33d151825427	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	\N	Link Chain Lightning when using Thunder Spear	1	Core	5	\N	f
3412b82c-19fb-4261-8957-95cd7578ffe1	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Thunder Spear Crit Hit	Thunder Spear Crit Hit Rate +30%	3	Normal	6	\N	f
ca02da17-52fc-4a6c-92ed-686903a31883	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	3412b82c-19fb-4261-8957-95cd7578ffe1	Crit Hit DMG Boost	Each Crit Hit increases next spear DMG +2% (max 200%)	3	Premium	0	\N	f
707e0bc0-40fc-41e8-804b-97bf225ad613	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Enhanced Crit Hit	Thunder Spear Crit Hit Rate +20%, Thunder Spear Crit Hit DMG +120%	3	Premium	7	\N	f
62504ecc-826d-40c1-9066-c8546b5da447	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	Duration	Duration +50%	1	Normal	0	\N	f
5d8599a2-8974-4e9b-9ae4-ab8359da9b0b	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Paralyzing Crit Hit	Thunder Spear Crit Rate +15%, 20% chance to inflict Paralysis	3	Normal	8	\N	f
a35760ed-6319-4b37-b6f0-fcbae2f980d2	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	CD Reduction	CD Speed +50%	3	Premium	9	\N	f
b35fc9f7-f7ca-4ff7-a773-184fb41a49c7	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Superconducting DMG	DMG +125%, drops by 25% every 30s	5	Normal	10	\N	f
81febe0e-3180-46e3-98e4-0bc53c713dc3	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	b35fc9f7-f7ca-4ff7-a773-184fb41a49c7	Superconducting Thunder	Thunder DMG +200%, decays by 40% every 30s	5	Premium	0	\N	f
ca50c614-5b99-4a20-9d46-5f57d5cdf4ec	5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	DMG Boost	DMG +60%	1	Normal	11	\N	t
b4e3555f-70e5-4038-8dc9-cbd6f8739bb5	\N	53472a38-ba0c-4363-a98c-a1e233da59fd	Duration	Duration +1% for every 10 monsters killed (max 150%)	1	Premium	1	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
44c95d0e-fc4a-4a8c-930b-7ef1f0068043	\N	\N	\N	Every 15 Sec, release a Fire Ring to ignite enemies in a large area	1	Core	1	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
bb3baf72-dafe-4e8a-af45-b46f9800f6aa	\N	\N	Fire Pillar	10% chance to generate Fire Pillar when attacking enemies	1	Premium	2	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
bd131eff-63c6-4107-8557-e1cfb08d9626	\N	bb3baf72-dafe-4e8a-af45-b46f9800f6aa	Fire Pillar DMG Boost	Fire Pillar DMG +50%	1	Normal	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
339ff8f3-7fd5-41ab-b1f1-1541a4ff597d	\N	bb3baf72-dafe-4e8a-af45-b46f9800f6aa	Large Fire Pillar	Fire Pillar Range +100%	1	Premium	1	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
357fd0f8-04b3-42a5-a2d9-2a782312ed0f	\N	bb3baf72-dafe-4e8a-af45-b46f9800f6aa	\N	Fire Pillar evolves to purple Fire, DMG +100%	1	Core	2	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
688377c5-34c7-485e-9981-f82a45ec1c5b	\N	\N	Burning	Fire has 50% chance to ignite enemies	3	Normal	3	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
445c7c66-600f-4b59-a686-59449808beb1	\N	688377c5-34c7-485e-9981-f82a45ec1c5b	Fire Explosion	50% chance to explode at target location when ignited	3	Premium	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
23ea0103-1382-449f-9b32-53f939db852a	\N	\N	Fire Scatter	Fire 2 additional Small Fires	3	Premium	4	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
fdc7e592-6f2a-48f0-99d7-5a3a108ac3fd	\N	23ea0103-1382-449f-9b32-53f939db852a	Duration	Small Fire DMG +50%	3	Normal	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
460e710d-ae1b-4786-abea-0ee71d5ead68	\N	\N	Range Boost	Fire Spray Range +50%	3	Normal	5	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
140b2792-aa9f-4816-9e5e-6f4982abbf92	\N	460e710d-ae1b-4786-abea-0ee71d5ead68	Range Boost	Fire Spray Range +50%, Fire Spray DMG +50%	3	Premium	0	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
b37762a2-08c2-4bec-be6a-311c06d274e4	\N	\N	Bouncing Fireball	Kill an enemy to generate 2 Fireballs	5	Premium	6	dca8e863-293d-46f5-aaa1-5efd0ae93710	f
c82a7546-7875-4cd5-aee2-8f19473c88ed	\N	\N	DMG Boost	DMG +60%	1	Normal	7	dca8e863-293d-46f5-aaa1-5efd0ae93710	t
652f7527-e3eb-4faf-b6d2-347df67fc084	\N	\N	Chain Slash	Triple Slash	1	Normal	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
fb26ca43-1ab6-4bd8-8402-5da9ec550cd2	\N	652f7527-e3eb-4faf-b6d2-347df67fc084	Chain Slash	Five Slash	1	Normal	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
b46007af-fd50-4081-bc62-fb72f248ee51	\N	652f7527-e3eb-4faf-b6d2-347df67fc084	Chain Slash	Ten Slash	1	Premium	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
a186701e-9791-46a2-9637-a4dcd0e6be2f	\N	\N	Link – Judgement	10% chance to fire 6 Judgment Cannons each attack	1	Premium	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
188ecae8-7206-42cf-b1fd-4a846b675341	\N	\N	High-Speed Slash	Evolve to High-Speed Slash. Slash Wave Speed increased.	3	Premium	2	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
574da257-66e5-42b8-97bc-823283d6d697	\N	\N	Projectile Boost	Projectile +2.	1	Normal	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
318b64d8-2e07-4f68-8208-1e939b40fdef	\N	188ecae8-7206-42cf-b1fd-4a846b675341	Circular Slash	Every 10 attacks, Fire 10 Small Slash Waves around	3	Premium	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
6462c39c-6071-4046-9e97-476cb059323d	\N	188ecae8-7206-42cf-b1fd-4a846b675341	DMG Boost	Small Slash Wave DMG +50%	3	Normal	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
9412808e-b23c-40ce-be87-dc1e23c712f4	\N	188ecae8-7206-42cf-b1fd-4a846b675341	Execute	Execute Minions with HP ≤20%, has half the effect on elites and bosses.	3	Premium	2	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
78f15063-744c-4bb2-9af6-8b09247ad09c	\N	\N	Slow Slash	Significantly slow down enemies on hit	3	Normal	3	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
8347f41f-54ac-4497-8d30-1f3833e39685	\N	\N	Fire Slash	Evolve to Fire Slash. Slash Wave Speed decreases. Range +50%.	1	Premium	4	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
7e56b78b-fd16-4cce-ae81-f94dcf33c263	\N	8347f41f-54ac-4497-8d30-1f3833e39685	Split Hit	Split into 2 small Slash Waves upon hitting the first enemy	1	Premium	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
e1af5db6-e9ec-4ebe-8102-3aefe66ef33e	\N	8347f41f-54ac-4497-8d30-1f3833e39685	Split Boost	Small Slash Wave +2	1	Normal	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
50d6c07a-413c-4649-8b72-910cd5eb0220	\N	\N	Fire Meteor	Summon a Fire Meteor every 2 Sec	3	Premium	5	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
25f449f9-0637-4b20-8bda-bc788d797874	\N	50d6c07a-413c-4649-8b72-910cd5eb0220	Meteor Suppression	Fire Meteor deals 3x DMG to slowed enemies	3	Normal	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
fe2e9299-0313-4b4b-b657-fd2769cac960	\N	50d6c07a-413c-4649-8b72-910cd5eb0220	Fiery Meteor	Fire Meteor Range +50%	3	Normal	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
89e12bd7-d9b2-4dae-a40c-c360db7fb3f6	\N	50d6c07a-413c-4649-8b72-910cd5eb0220	\N	Evolve to Ultimate Meteor. Fire Meteor DMG +100%, Cooldown Speed +100%	3	Core	2	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
307745ad-0842-42e3-be04-fca154715bc3	\N	\N	Fire Judgment	Every 10 attacks, execute Judgment on all enemies in Range	5	Premium	6	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
2c9c34fd-1c6e-4077-a684-c9003d07adb9	\N	\N	Sword Control - Yin	Randomly drops Flying Sword - Yin every 15s.	1	Premium	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
7577c2dd-eb0f-494a-96a5-f2487308819b	\N	2c9c34fd-1c6e-4077-a684-c9003d07adb9	Double Flying Swords	[Sword Control - Yin] Count +100%	1	Premium	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
7c35ba9a-184f-4424-89cb-2a2a69eb3779	\N	2c9c34fd-1c6e-4077-a684-c9003d07adb9	Flying Sword DMG Boost	[Sword Control - Yin] DMG +50%	1	Normal	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
b838499b-4c92-4eac-9aff-cda5f6f671c7	\N	2c9c34fd-1c6e-4077-a684-c9003d07adb9	\N	[Sword Control] CD Speed +50%, Flying Sword Count +50%. (take either Sword Control - Yin/Yang)	1	Core	2	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
3fe8fbd8-6666-4855-8666-3fce04d150fc	\N	\N	Sword Control - Yang	Throw 9 Flying Swords (Yang) every 15s.	1	Premium	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
5d5636dc-4267-49bf-8024-8dc3c7e26e16	\N	3fe8fbd8-6666-4855-8666-3fce04d150fc	Double Flying Swords	[Sword Control - Yang] Count +100%	1	Premium	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
2c430e1f-eb08-472e-a7f0-cb15843c99c8	\N	3fe8fbd8-6666-4855-8666-3fce04d150fc	Flying Sword DMG Boost	[Sword Control - Yang] DMG +50%	1	Normal	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
c2135452-d3f1-41af-b1be-1153820a6580	\N	3fe8fbd8-6666-4855-8666-3fce04d150fc	Link – Shooting Star	Azureblade Immortal Crit Hit +25%, 5% chance to fire an extra Shooting Star when attacking.	1	Premium	2	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
ded2a5fe-961b-41c1-b0d8-eec51da04243	\N	\N	DMG Boost	DMG +60%	1	Normal	8	70a95a22-43a2-443b-b749-339a597981d8	t
1d839c80-ed18-4197-a473-a721120c1643	ffdb479f-7e51-442d-aba8-73491021b5fb	62504ecc-826d-40c1-9066-c8546b5da447	Duration	Duration +50%	1	Normal	0	\N	f
bb2d9623-e056-4aaf-81d2-4def18cbfd0b	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
98d936ca-4982-41b2-aa9c-ad4c48611a19	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	bb2d9623-e056-4aaf-81d2-4def18cbfd0b	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
8503b3ef-6663-452f-b90a-8129c10a68fe	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	98d936ca-4982-41b2-aa9c-ad4c48611a19	Continuous Fire	Continuous Fire +2	1	Premium	0	\N	f
ae69bf09-5c6e-47cd-b3c6-166ecc61e919	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	bb2d9623-e056-4aaf-81d2-4def18cbfd0b	\N	Continuous Fire ×2	1	Core	1	\N	f
f9fe75b5-539e-4a15-b208-33bbb10228b9	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Energy Shield	Generate a 4s Energy Shield every 10 kills, repeated triggers extends its duration	1	Premium	1	\N	f
92557f45-2b36-46dc-ac52-fb4c8e4d9865	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	f9fe75b5-539e-4a15-b208-33bbb10228b9	DMG Boost Shield	Energy Shield Damage +50%	1	Normal	0	\N	f
274e71d1-000a-4602-96a0-19a234ad57ec	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	f9fe75b5-539e-4a15-b208-33bbb10228b9	Bigger Shield	Energy Shield Size +50%	1	Normal	1	\N	f
1eb9a808-862b-4e1d-a177-a199d3a292a0	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	f9fe75b5-539e-4a15-b208-33bbb10228b9	Explosive Shield	Energy Shield has a 20% chance to explode when hitting an enemy	1	Normal	2	\N	f
ec6dc1eb-a471-46b3-958b-96838b5acdbd	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	f9fe75b5-539e-4a15-b208-33bbb10228b9	\N	Transform into a dual-layer Shield, Shield Size +50%	1	Core	3	\N	f
a6b77499-aa37-41e2-a037-ee8bc159d966	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Explosive Boost	Explosion Range +50%	3	Normal	2	\N	f
56c590f2-735a-4730-ac36-95b0d86ef664	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	a6b77499-aa37-41e2-a037-ee8bc159d966	Explosive Boost	Explosion Range +100%	3	Premium	0	\N	f
dd9890bc-cda7-41b1-a18d-1e427d84bea2	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Energy Split	Hits spawn 2 Mini Energy Orbs, passing through an Energy Shield spawns 2 more	3	Premium	3	\N	f
6077b470-97fd-4374-af00-38907c4cafaa	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	dd9890bc-cda7-41b1-a18d-1e427d84bea2	Split Boost	Mini Energy Orb Count +2	3	Normal	0	\N	f
bec5e51f-7bf0-4daa-b876-187fa50686e7	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Charged Beam	Fires an extra Charged Beam every 10 shots, bombarding enemies in a straight line	5	Premium	4	\N	f
491169aa-5067-4796-b5af-b5fe3a31732f	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	bec5e51f-7bf0-4daa-b876-187fa50686e7	Fire Trail Beam	Charged Beam leaves a light trail on the ground	5	Normal	0	\N	f
22b1350c-4747-4bcd-abfc-7f95f9b09450	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	bec5e51f-7bf0-4daa-b876-187fa50686e7	Beam Boost	Charged Beam DMG +50%	5	Normal	1	\N	f
0496b873-9933-45f7-8b73-f6a98754a7b3	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	bec5e51f-7bf0-4daa-b876-187fa50686e7	Beam Amplification	Charged Beam Area of Effect +50%	5	Normal	2	\N	f
ecef41f1-ab6d-4d9b-bdfb-b78df0d01469	9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	DMG Boost	DMG +60%	1	Normal	5	\N	t
56852fa0-4d7d-4fed-963c-db594a8aad47	ffdb479f-7e51-442d-aba8-73491021b5fb	1d839c80-ed18-4197-a473-a721120c1643	Duration	Duration +100%	1	Premium	0	\N	f
c0ef002e-d1e1-46cb-b17c-384d60f13bbd	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	\N	Burning effect spreads to nearby enemies	1	Core	1	\N	f
58b7f558-df77-429a-9d0c-44ff98a02978	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	Range Boost	Fire Range +50%. DMG +50%. Fire Evolution: 33%	3	Normal	2	\N	f
1574107a-fa52-4655-b671-af7daa71116c	ffdb479f-7e51-442d-aba8-73491021b5fb	58b7f558-df77-429a-9d0c-44ff98a02978	Range Boost	Fire Range +50%. DMG +50%. Fire Evolution: 66%	3	Normal	0	\N	f
3e650730-b9bc-4c60-9693-b02ba0f4486b	ffdb479f-7e51-442d-aba8-73491021b5fb	1574107a-fa52-4655-b671-af7daa71116c	Blue Fire	Upgrade to blue fire. Explode after hitting enemies	3	Premium	0	\N	f
fe104458-4bc1-46ba-9ecf-65f13b66e522	ffdb479f-7e51-442d-aba8-73491021b5fb	1574107a-fa52-4655-b671-af7daa71116c	Super Blue Fire	Evolve to blue fire. Triggers super explosion on hit	3	Premium	1	\N	f
741d0ded-3c1c-407c-8054-dfefdd536ffa	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	Burning	Ignites enemy on hit	3	Premium	3	\N	f
746f93ed-d4bb-4f3d-8dda-62e6baf5d0dc	ffdb479f-7e51-442d-aba8-73491021b5fb	741d0ded-3c1c-407c-8054-dfefdd536ffa	Burning DMG Boost	DMG to Burning enemy +100%	3	Normal	0	\N	f
10cca517-dc11-4371-beda-4de797fba264	ffdb479f-7e51-442d-aba8-73491021b5fb	741d0ded-3c1c-407c-8054-dfefdd536ffa	DMG Boost	For every 5 burning, DMG +1% (max 150%)	3	Premium	1	\N	f
a9fee683-1a43-40ac-83fb-6b610b870491	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
78d65811-5113-4e6b-844f-753262509b11	\N	\N	Supply Magazine	Mag +3	1	Normal	2	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
8dc1d4dc-d1be-46ec-9ab5-f0e3368fccbf	\N	a9fee683-1a43-40ac-83fb-6b610b870491	Projectile Boost	Projectile +1	1	Normal	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
826cc4f8-f15a-491c-8e9a-3aa279ed0c13	\N	a9fee683-1a43-40ac-83fb-6b610b870491	Projectile Boost	Ballistic trajectory x2	1	Premium	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
2a3a18f3-f8fb-4475-9916-25475dbf3f63	\N	\N	Fire Rate Boost	Fire Rate +60%	1	Normal	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
2d1b5904-b712-4085-adb7-22ef9eb7dfbe	\N	2a3a18f3-f8fb-4475-9916-25475dbf3f63	Fire Rate Boost	Fire Rate +60%	1	Normal	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
e81877a8-6f78-479c-a60a-e656d9aed301	\N	2a3a18f3-f8fb-4475-9916-25475dbf3f63	Fire Rate Boost	Fire Rate +60%	1	Normal	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
07be64cc-f003-4522-9f58-28f37bc84e22	\N	\N	Chain Lightning	25% chance to trigger Chain Lightning upon hitting  an enemy	1	Premium	2	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
30bfb227-c824-43eb-af93-4dd54524578f	\N	07be64cc-f003-4522-9f58-28f37bc84e22	\N	Evolve into Super Chain Lightning, targets +2, DMG +50%	1	Core	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
8af609ea-1476-4b44-b912-02b421907e22	\N	07be64cc-f003-4522-9f58-28f37bc84e22	Increase Target	Chain Lightning target +1	1	Normal	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
f65403c4-3565-4300-a243-2141e934efeb	\N	07be64cc-f003-4522-9f58-28f37bc84e22	DMG Boost	Chain Lightning DMG +50%	1	Normal	2	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
4109b628-c555-43c5-92de-d3b4255416ea	\N	\N	Electrical Boost	Chain Lightning has a 50% chance to trigger additional Lightning	1	Premium	3	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
c4925bee-5fe6-49bc-97a4-af89a20cfea1	\N	\N	Giant Lightning	Every 10 lightning bolts, release 1 giant lightning bolt on nearby enemies	3	Premium	4	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
7dcfcd51-1254-41a6-9475-f3f38ba9af3c	\N	\N	Trigger Lightning	20% chance to trigger lightning upon hitting on enemy	3	Normal	5	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
b84fd4df-dc39-4379-a491-c9ca77cfc2b4	\N	\N	Thunderous Judgment	Every 30 attacks, execute Judgment on all enemies in range	3	Premium	6	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
b5af3068-fd28-48f7-955f-acdd160c2d4e	\N	78d65811-5113-4e6b-844f-753262509b11	Supply Magazine	Mag +3	1	Normal	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
4c0bfd74-e6b8-4900-baea-6203b5ef09a8	\N	78d65811-5113-4e6b-844f-753262509b11	Storm Swordplay	Reload +100%, Mag +6, Fire Rate +30%	1	Premium	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
ba5dee18-692f-4f10-be7a-bbfb40744028	\N	\N	Sword Wheel - Yang	Every 12 shots, throw Sword Wheel (Yang) 3 times and then return.	3	Premium	3	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
00655337-c34f-48b3-9cb9-69bc9e3fb608	\N	ba5dee18-692f-4f10-be7a-bbfb40744028	Double Flying Swords	[Sword Wheel - Yang] Count +100%	3	Premium	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
4e8602af-36c7-4d70-9e3c-3661a1c77c2a	\N	ba5dee18-692f-4f10-be7a-bbfb40744028	Flying Sword DMG Boost	[Sword Wheel - Yang] DMG +50%	3	Normal	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
e6f5f113-423f-4bed-82f6-18dc91fb777d	\N	ba5dee18-692f-4f10-be7a-bbfb40744028	\N	Cosmic Sword Wheel: When releasing [Sword Wheel - Yang/Yin], add equal amount of the other Flying Sword. (take either)	3	Core	2	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
a47a93c4-f3ac-4669-a614-b044159e2231	\N	\N	Swordplay - Yang	Flying Sword - Yang has 10% chance to trigger small area Sword Aura on hit.	5	Premium	4	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
f5889b92-0706-4016-a5bb-69835464dccf	\N	\N	Sword Wheel - Yin	Every 18 shots, surround with 4 Flying Swords (Yin) to form a Sword Wheel.	3	Premium	5	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
1f20cc67-6e50-414c-849c-ee8fd6a7d554	\N	f5889b92-0706-4016-a5bb-69835464dccf	Double Flying Swords	[Sword Wheel - Yin] Count +100%	3	Premium	0	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
c4ec2364-d46e-463e-8d2f-12ce3b06dc67	\N	f5889b92-0706-4016-a5bb-69835464dccf	Flying Sword DMG Boost	[Sword Wheel - Yin] DMG +50%	3	Normal	1	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
5e74ad47-1def-4cfe-88ec-747c0ce2afaf	\N	\N	Swordplay - Yin	Flying Sword - Yin gains +0.5% DMG per kill, max 150%.	5	Premium	6	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	f
efa6127f-4e29-4734-8e0c-e3f135364a95	\N	\N	DMG Boost	DMG +60%	1	Normal	7	eafcc8f5-69ef-45ae-ac2c-3d8891ed3464	t
e43bb64b-80da-44a0-88c0-739350c634e7	\N	307745ad-0842-42e3-be04-fca154715bc3	Judgment Burning	Judgment inflicts Ignition Effect	5	Normal	0	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
3b5dc379-9b8b-4b2a-b043-12ffb8546a7d	\N	307745ad-0842-42e3-be04-fca154715bc3	Judgment DMG Boost	Judgment DMG +50%	5	Normal	1	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
07744206-f443-4439-89f8-ff9faa12f503	\N	307745ad-0842-42e3-be04-fca154715bc3	\N	Evolve to Judgment of Ice and Fire. Judgment DMG +100%, Add Freeze effect	5	Core	2	ea701ac5-9a74-44e5-9bc2-296435811a1c	f
09a3ea06-9088-48c8-81d2-08b3e29f9928	\N	\N	DMG Boost	DMG +60%	1	Normal	7	ea701ac5-9a74-44e5-9bc2-296435811a1c	t
35af864c-2e4c-4407-aa3b-96c8824b6afd	\N	574da257-66e5-42b8-97bc-823283d6d697	Projectile Boost	Projectile +2.	1	Normal	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
927a455f-b5f3-4264-bc5b-c955d7daa42e	\N	\N	Freeze	100% chance to freeze enemies for 2 Sec upon hit.	1	Premium	1	151659eb-87bc-4f27-959f-e6ba974b1b32	f
74c28f59-a2c1-4f8a-9cb8-921ace89f84f	\N	927a455f-b5f3-4264-bc5b-c955d7daa42e	Ice Shard DMG Boost	DMG to frozen enemies +150%.	1	Premium	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
feb6ab9f-564d-401d-91de-f8afcdf04a04	\N	\N	\N	Trigger Ice Storm when hitting frozen enemies.	1	Core	2	151659eb-87bc-4f27-959f-e6ba974b1b32	f
0dadc875-36ec-4264-a65a-5b7dd7c9b9bd	\N	\N	Ice Needle Protection	Fire 4 Ice Needles in all directions upon reload.	3	Premium	3	151659eb-87bc-4f27-959f-e6ba974b1b32	f
2164b4d5-6c51-41c6-8314-d552de29beda	\N	0dadc875-36ec-4264-a65a-5b7dd7c9b9bd	Freeze	[Ice Needle] has 30% chance to freeze enemy.	3	Premium	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
4d5fe334-e4e3-4457-9659-cb02ce7903d3	\N	0dadc875-36ec-4264-a65a-5b7dd7c9b9bd	Ice Needle Double	Increase Ice Needle to 8.	3	Premium	1	151659eb-87bc-4f27-959f-e6ba974b1b32	f
4cfaf773-3d2a-43f2-8054-b55bb29b3065	\N	0dadc875-36ec-4264-a65a-5b7dd7c9b9bd	Ice Needle DMG Boost	Ice Needle DMG +50%.	3	Normal	2	151659eb-87bc-4f27-959f-e6ba974b1b32	f
1f6ad8ca-b994-4a59-8c56-f2c3a2ebe3ba	\N	0dadc875-36ec-4264-a65a-5b7dd7c9b9bd	\N	Ice Needle evolves into Ice Storm with much higher DMG.	3	Core	3	151659eb-87bc-4f27-959f-e6ba974b1b32	f
e2b2c80c-e0e7-4f0f-ab74-12f56fffe9d1	\N	\N	Limit Reload	Reload after each shot, Reload Speed +100%.	3	Premium	4	151659eb-87bc-4f27-959f-e6ba974b1b32	f
7ea891d9-cbdd-46d9-ba72-2e3c6d577fd4	\N	e2b2c80c-e0e7-4f0f-ab74-12f56fffe9d1	Quick Reload	Reload speed +50%.	3	Normal	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
a6620a8e-71bc-417e-8b33-fe1f08f7451f	\N	b84fd4df-dc39-4379-a491-c9ca77cfc2b4	Paralyzing Judgment	Judgment has a 50% chance to inflict Paralysis	1	Normal	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
8f2eb874-4b87-4fa6-8091-501e4097d94a	\N	b84fd4df-dc39-4379-a491-c9ca77cfc2b4	Judgment DMG Boost	Judgment DMG +50%	1	Normal	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
b3d67324-d3ba-4460-b5d2-b8caccf68036	\N	\N	Berserk Mode	Every 60s, enter Berserk Mode: Infinite Mag, Fire Rate +200%, Critical Hit Rate +30%	5	Premium	7	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
8ee46d59-4340-4d92-86c7-70564d8afc65	\N	b3d67324-d3ba-4460-b5d2-b8caccf68036	Critical DMG Berserk	In Berserk Mode, Crit Hit DMG +250%	1	Normal	0	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
135a9d3e-9836-4c5e-982e-cf83c9faab4e	\N	b3d67324-d3ba-4460-b5d2-b8caccf68036	Berserk DMG	In Berserk Mode, DMG +100%	1	Normal	1	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
09c27f21-3253-46ba-ac0a-7e55ee893930	\N	b3d67324-d3ba-4460-b5d2-b8caccf68036	\N	Upgrade to Infinite Berserk, slightly increase DMG	1	Core	2	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	f
cacc03ab-4da5-409d-aae0-0707de8ac488	ffdb479f-7e51-442d-aba8-73491021b5fb	741d0ded-3c1c-407c-8054-dfefdd536ffa	CD Growth	For every 100 burning, CD speed +20% (max 100%)	3	Premium	2	\N	f
3eb3cb9b-dd7c-441f-8b59-6907b73a429d	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	Fire Residue	10% chance to trigger fire circle when attacking enemy	5	Premium	4	\N	f
fee60b4a-6e2f-4e04-9f3f-e42f3b951a8b	ffdb479f-7e51-442d-aba8-73491021b5fb	3eb3cb9b-dd7c-441f-8b59-6907b73a429d	Residual Fire Slow Down	Fire circle with 50% slow effect	5	Normal	0	\N	f
b9f753cc-8dec-4893-8703-b1e8104de2d0	ffdb479f-7e51-442d-aba8-73491021b5fb	3eb3cb9b-dd7c-441f-8b59-6907b73a429d	Residual Fire DMG Boost	Fire circle DMG +100%	5	Normal	1	\N	f
c0ab28fe-711e-47ca-8bfb-da9b0d64449e	ffdb479f-7e51-442d-aba8-73491021b5fb	3eb3cb9b-dd7c-441f-8b59-6907b73a429d	Residual Fire Range	Fire circle Range +100%	5	Normal	2	\N	f
52bdc754-b8b8-4f86-bea4-7bde9018b02a	ffdb479f-7e51-442d-aba8-73491021b5fb	\N	DMG Boost	DMG +50%	1	Normal	5	\N	t
6990d17f-eaa9-4a9e-831a-dc10d3c4d711	a70d3aa7-d788-4cde-a745-df842ccb4b6e	95388caa-33c0-42b5-894f-9510b241035d	Judgement	Deal 2.5x DMG to monsters with ≥ 50% Health.	5	Premium	0	\N	f
0630f19d-1c7f-40d3-9612-1634e75df10b	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Firepower Suppression	Fire 2 rockets per shot.	5	Premium	8	\N	f
902abb38-c97d-4378-8b7b-30609786210c	\N	\N	Multi Slash	Triple Slash	1	Normal	0	848b45e8-9220-424f-8445-dbad2d563a16	f
95316741-c477-4698-b3e6-17cca15b3e97	\N	902abb38-c97d-4378-8b7b-30609786210c	Multi Slash	Hexa Slash	1	Normal	0	848b45e8-9220-424f-8445-dbad2d563a16	f
0f0f34a4-ed23-4784-a133-e4adf72d7bd4	\N	902abb38-c97d-4378-8b7b-30609786210c	Multi Slash	Nona Slash, each Slash DMG +15%, resets after Multi Slash ends.	1	Premium	1	848b45e8-9220-424f-8445-dbad2d563a16	f
717e295e-5949-47d7-a3c8-b2c262f6ea4e	\N	\N	\N	Crit Hit Rate +30%, creates a small AoE Furious Slash on Crit Hit.	1	Core	1	848b45e8-9220-424f-8445-dbad2d563a16	f
902a0c05-fc27-4506-9a8a-5e7c3852e223	\N	\N	Link – Azure Thunder	10% chance on attack to drop a Thunder Blade on a nearby enemy.	1	Premium	2	848b45e8-9220-424f-8445-dbad2d563a16	f
ea1e6821-966a-4309-a92a-41150ef23265	\N	\N	Soaring Azure Dragon	10% chance to summon an Azure Dragon on hit.	3	Premium	3	848b45e8-9220-424f-8445-dbad2d563a16	f
27b5bb9e-8c0c-44d4-93a5-1e3a4c4472fa	\N	ea1e6821-966a-4309-a92a-41150ef23265	Azure Dragon Resurgence	Azure Dragon summon probability increased.	3	Normal	0	848b45e8-9220-424f-8445-dbad2d563a16	f
5790b9ee-c3d8-4ad2-9e4b-f28ce2b20871	\N	ea1e6821-966a-4309-a92a-41150ef23265	DMG Boost	Azure Dragon DMG +50%	3	Normal	1	848b45e8-9220-424f-8445-dbad2d563a16	f
003065f6-757c-4004-ba88-5bce3340b84d	\N	ea1e6821-966a-4309-a92a-41150ef23265	Range Boost	Azure Dragon Size +50%	3	Normal	2	848b45e8-9220-424f-8445-dbad2d563a16	f
994aadf8-6bb7-4706-8002-94d3b888f4cd	\N	ea1e6821-966a-4309-a92a-41150ef23265	\N	Azure Dragon Size +50%. Deals extra AoE DMG when it soars.	3	Core	3	848b45e8-9220-424f-8445-dbad2d563a16	f
6e9ac10d-b810-4063-af0d-29ecd26d8ca4	\N	\N	Range Boost	Slash Range increases with movement.	3	Premium	4	848b45e8-9220-424f-8445-dbad2d563a16	f
4c7c2dc6-ad9f-42cf-a204-f2ec8e8b29d2	\N	6e9ac10d-b810-4063-af0d-29ecd26d8ca4	Mountains Asunder	Slash Distance +50%	3	Normal	0	848b45e8-9220-424f-8445-dbad2d563a16	f
9cf899b0-a85e-4c32-a955-139a507d9e89	\N	6e9ac10d-b810-4063-af0d-29ecd26d8ca4	DMG Boost	Slash DMG increases with movement.	3	Premium	1	848b45e8-9220-424f-8445-dbad2d563a16	f
0c5b942d-bf68-4e06-ae3d-240fe353578b	\N	\N	Splitting Slash	3rd slash becomes a splitting slash with more slashes.	5	Premium	5	848b45e8-9220-424f-8445-dbad2d563a16	f
4fb99aac-aeaa-46da-92d8-76e75f174f8b	\N	0c5b942d-bf68-4e06-ae3d-240fe353578b	Split DMG Boost	Splitting Slash DMG +100%	5	Premium	0	848b45e8-9220-424f-8445-dbad2d563a16	f
1f34e39e-c6f1-45ff-baf1-f62b8857ded3	\N	0c5b942d-bf68-4e06-ae3d-240fe353578b	Multiple Splits	Splitting Slashes +2	5	Normal	1	848b45e8-9220-424f-8445-dbad2d563a16	f
bc57c4d1-a823-424a-b58e-1f0647812a3d	\N	\N	Shatter Slash	Slash leaves a trace on the ground.	1	Premium	6	848b45e8-9220-424f-8445-dbad2d563a16	f
ca87aaae-8dc2-4b18-9cf8-2ad79a58a819	\N	bc57c4d1-a823-424a-b58e-1f0647812a3d	Rend Earth	Slash Trace Duration +1s.	1	Normal	0	848b45e8-9220-424f-8445-dbad2d563a16	f
fb4f936d-adec-46fe-8cc5-bd6c75342849	\N	bc57c4d1-a823-424a-b58e-1f0647812a3d	DMG Boost	Slash Trace DMG +100%.	1	Normal	1	848b45e8-9220-424f-8445-dbad2d563a16	f
08e61794-b220-43f6-8beb-895c4ccc692d	\N	\N	DMG Boost	DMG +60%	1	Normal	7	848b45e8-9220-424f-8445-dbad2d563a16	t
9933281a-55d2-4bb8-bc03-c6e21f0428d1	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
ca2a6695-120f-4012-bf2f-d34466f88b4c	\N	9933281a-55d2-4bb8-bc03-c6e21f0428d1	Projectile Boost	Projectile +1	1	Normal	0	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
d7acccd6-ff4d-4e26-a58a-23587b018c4a	\N	9933281a-55d2-4bb8-bc03-c6e21f0428d1	Projectile Boost	Projectile +2	1	Normal	1	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
59d194b4-1097-4e54-9e2f-ec304dde5275	\N	\N	Ice Bullet	Trigger an Ice Storm after hitting enemies	1	Premium	1	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
a9c67628-7d1a-475c-8b48-455db27f9af0	\N	\N	\N	Projectile x2	1	Core	2	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
fa81d173-ef2b-48c5-ae93-3f0a82144af9	\N	\N	\N	Lightning evolves into Crimson Thunder, greatly increasing DMG	1	Core	3	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
81713bd7-3117-4d7f-9166-b2a193cc12d3	\N	\N	Split Hit	Split into 3 small bullets after hitting enemies	3	Normal	4	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
f983f4b5-b432-4364-9f6a-57f3b9b97445	\N	81713bd7-3117-4d7f-9166-b2a193cc12d3	Split Boost	Split bullet +3	3	Normal	0	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
136b3791-3211-4d6d-8863-88975a88e980	\N	\N	Penetration Boost	Bullet Penetration +2	3	Premium	5	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
1df55443-789a-4263-914b-02a2ddf7e16e	\N	\N	Full Penetration	Bullet penetration +1, Split bullet penetration +1	3	Premium	6	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
fda29c64-7fd3-4c8c-be84-0c83cf0ba80b	\N	\N	DMG Boost	DMG +60%	1	Normal	8	7d43f296-cf8e-49e7-8f92-e54e5c26ff84	t
3ed4e135-09a7-4d74-b18e-e29c8cf87892	a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	DMG Boost	DMG +60%	1	Normal	9	\N	t
e59ed114-a1b0-4bb3-b381-e8afc90569ad	5496bedd-6f37-4247-9325-f1cfb7b63cd8	40b1ca76-fa4a-4f1e-9c74-47b600c1a115	Count Boost	Fireball Count +100%	1	Premium	0	\N	f
b5fffd23-6d76-4c8a-bfd6-359d9003a9b9	5496bedd-6f37-4247-9325-f1cfb7b63cd8	40b1ca76-fa4a-4f1e-9c74-47b600c1a115	Fireball Ignition	Fireball ignites enemy on hit	1	Normal	1	\N	f
2005922c-8674-4ba8-ad8b-0b815decdbf7	5496bedd-6f37-4247-9325-f1cfb7b63cd8	40b1ca76-fa4a-4f1e-9c74-47b600c1a115	DMG Boost	Fireball DMG +50%	1	Normal	2	\N	f
dbea5c15-d139-4a60-8661-fc18a01c61dd	5496bedd-6f37-4247-9325-f1cfb7b63cd8	40b1ca76-fa4a-4f1e-9c74-47b600c1a115	\N	Splash Fireball bounces again after landing	1	Core	3	\N	f
a8b752f4-e6ee-4938-b10e-4aa2cebd04af	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	Lava Residue	Leaves a Lava Pool on the ground after Explosive Flame hits	3	Premium	3	\N	f
4555f700-974e-4e28-90ec-14287dffff7f	5496bedd-6f37-4247-9325-f1cfb7b63cd8	a8b752f4-e6ee-4938-b10e-4aa2cebd04af	Range Boost	Lava Pool Range +50%	3	Normal	0	\N	f
7b32c503-02ea-4706-b1e4-7f4f394bf0c8	5496bedd-6f37-4247-9325-f1cfb7b63cd8	a8b752f4-e6ee-4938-b10e-4aa2cebd04af	High-Frequency Lava	Lava Pool DMG Frequency +100%	3	Premium	1	\N	f
584c58cd-cfc7-40c2-b73b-49cab869b0f5	5496bedd-6f37-4247-9325-f1cfb7b63cd8	a8b752f4-e6ee-4938-b10e-4aa2cebd04af	Delayed Lava	Lava Pool Duration +50%	3	Normal	2	\N	f
58ce40e6-d01a-4347-8318-d793b08f1fc2	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	Range Boost	Explosive Flame Range +50%	3	Normal	4	\N	f
757cfc1a-537c-492e-bf6f-ae8b0cd9e7dd	5496bedd-6f37-4247-9325-f1cfb7b63cd8	58ce40e6-d01a-4347-8318-d793b08f1fc2	Range Boost	Explosive Flame Range +50%, DMG +50%	3	Premium	0	\N	f
ff3cfc2f-325e-46c1-9e31-dc882aa8603e	5496bedd-6f37-4247-9325-f1cfb7b63cd8	58ce40e6-d01a-4347-8318-d793b08f1fc2	Range Boost	Explosive Flame Range +100%	3	Premium	1	\N	f
80142d4f-72d7-453f-96e3-c59ba6974ca0	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	Explosion Ignition	Explosive Flame has 50% chance to ignite enemy on hit	5	Normal	5	\N	f
7d5cff1c-5fed-45e2-9707-66f44380893c	5496bedd-6f37-4247-9325-f1cfb7b63cd8	80142d4f-72d7-453f-96e3-c59ba6974ca0	Probability Boost	Ignition probability doubled	5	Normal	0	\N	f
3834a998-60ea-4d78-9940-e2f947670f73	\N	\N	Full DMG Boost	Bullet DMG +100%, Split bullet DMG +100%	3	Premium	7	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
db49557a-826c-4f1f-bccd-15c3c1e5402f	\N	\N	Split DMG Boost	Split bullet DMG +100%	3	Normal	8	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
7d611ef3-e670-4518-b0b3-d2d8111346db	\N	\N	Fire Rate Boost	Fire Rate +50%	5	Normal	9	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
9440a15d-fd48-4f63-b7ca-6a52892d0e6e	\N	\N	Mag Upgrade	Fire Rate +25%, Mag +8	5	Normal	10	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
d20f20d5-29f1-4ae9-ac90-e080a204322e	\N	\N	Strength Boost	When Elite enemy or BOSS appears, Fire Rate +200% for 30 secs	5	Premium	11	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
e2896aeb-57c2-4f89-945a-abacbc26d8db	\N	\N	Stationary Fire	When HP ≥70% Fire Rate +25%, 30% chance not to consume bullets	5	Premium	12	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	f
22b96dd3-097a-402c-970a-50c6e5641b82	\N	\N	DMG Boost	DMG +60%	1	Normal	13	999bb25b-2c1d-4d75-aec4-bb0d8da3f6c0	t
6c256aae-1544-48f4-bdc4-6bf23c2d68e3	\N	\N	Continuous Attack	Duration +50%	1	Normal	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
3d784e5e-3ef6-4368-b282-1475e3aa75dd	\N	6c256aae-1544-48f4-bdc4-6bf23c2d68e3	Continuous Attack	Duration +50%	1	Normal	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
ee43a2b4-66c7-4013-9a81-339b2a462422	\N	6c256aae-1544-48f4-bdc4-6bf23c2d68e3	Continuous Attack	Duration +50%, Freeze Chance +10%	1	Premium	1	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
f684c305-4a6f-4fd4-babe-c04e2d229d10	\N	\N	Link – Laser	[Coldfront Warden][Laser Turret] DMG Frequency +60%	1	Premium	1	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
b745cb95-0126-4fa0-95e6-1f13f7cb58b3	\N	\N	Ice Barrage	Fire 1 round of Ice Bullets every 10 freezes	1	Premium	2	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
549556d7-bc05-4d17-baf7-3725e344362c	\N	b745cb95-0126-4fa0-95e6-1f13f7cb58b3	\N	Ice Light Bullet Damage +100%, 30% Chance to Freeze Enemy on Hit	1	Core	0	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
98685d1d-1660-491e-82b0-f9ea428f1c13	\N	b745cb95-0126-4fa0-95e6-1f13f7cb58b3	Freeze Effect	Ice Bullet DMG to frozen enemies +100%	1	Premium	1	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
e4f84fb8-3445-4c73-915c-956020bc93e0	\N	b745cb95-0126-4fa0-95e6-1f13f7cb58b3	Projectile Boost	Ice Bullet count +5	1	Normal	2	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
3cc89fb1-5f26-4775-97fd-abb816fbbaa0	\N	\N	Rapid Fire	Continuous Fire +3	1	Normal	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
76eb024c-f4d2-4242-b2c8-162ad085e877	\N	3cc89fb1-5f26-4775-97fd-abb816fbbaa0	Rapid Fire	Continuous Fire +3	1	Normal	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
745f5ad5-5273-431b-9c0a-aa6112697634	\N	3cc89fb1-5f26-4775-97fd-abb816fbbaa0	Swift Barrage	Continuous Fire +4, each shot Fire Rate +10%, resets after reloading.	1	Premium	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
390f145e-71bb-412f-a7ad-dc91aa18b57e	\N	\N	Arrow Rain	Release 1 Arrow Rain every 10 kills.	3	Premium	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
6f938e23-079f-4a99-a2e4-14edc24cb752	\N	390f145e-71bb-412f-a7ad-dc91aa18b57e	Heavy Arrow Rain	Arrow Rain DMG +50%.	3	Normal	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
7e846b5c-258f-46e2-af2b-54ed3c843f6f	\N	390f145e-71bb-412f-a7ad-dc91aa18b57e	Mighty Arrow Rain	Arrow Rain Range +100%.	3	Normal	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
6c9d85dc-8081-42bc-8a6b-1f65a5506593	\N	390f145e-71bb-412f-a7ad-dc91aa18b57e	Burning Arrow Rain	Arrow Rain causes Burning on hit.	3	Normal	2	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
a0120aa9-4239-46dd-8e71-55a0dac5d961	\N	390f145e-71bb-412f-a7ad-dc91aa18b57e	\N	Arrow Rain DMG +100%, Range +100%	3	Core	3	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
3a66f9b6-f6ab-4e7f-b7aa-49cb23129982	\N	\N	Fire Spread Shot	Every 10 shots, fire 7 Fire Arrows that ignite enemies.	5	Premium	2	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
17eb995a-fc35-43c9-9c59-487cab1520d6	\N	3a66f9b6-f6ab-4e7f-b7aa-49cb23129982	Wildfire Spread Shot	Fire Arrow +4	5	Normal	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
ded89acc-d2b7-45c7-aa91-d9638540aa40	\N	3a66f9b6-f6ab-4e7f-b7aa-49cb23129982	Inferno Spread Shot	Fire Arrow DMG +50%.	5	Normal	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
f89800e7-168d-4547-a972-704ba587298a	\N	\N	Light Arrow Volley	Fire small Light Arrows around every 10s.	5	Premium	3	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
90c687dc-54ce-409c-a5a2-fefb2d2da768	\N	f89800e7-168d-4547-a972-704ba587298a	Brightlight Volley	Small Light Arrow DMG +50%.	5	Normal	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
c328587e-0dde-40ac-8a9b-a5e67d0496c9	\N	f89800e7-168d-4547-a972-704ba587298a	Starlight Volley	Small Light Arrow Count +50%.	5	Normal	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
395f6257-ada8-4243-bf3a-d29a1b7edb93	\N	f89800e7-168d-4547-a972-704ba587298a	\N	Double Small Light Arrow, DMG +100%	5	Core	2	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
b89851c7-5ca2-428b-9583-683b40cc631f	\N	\N	Homing Arrow	Release 1 Homing Arrow.	1	Premium	4	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
e1bf059f-5536-488c-9123-5ae08d117b77	\N	b89851c7-5ca2-428b-9583-683b40cc631f	Dual Homing	Add 1 Homing Arrow.	1	Premium	0	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
96f1756c-cd40-4c80-96fa-c33c47a5a4ba	\N	b89851c7-5ca2-428b-9583-683b40cc631f	Enhanced Homing	Homing Arrow Size +50%.	1	Normal	1	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
802a49b5-7125-4695-b553-f541cfba73cd	\N	b89851c7-5ca2-428b-9583-683b40cc631f	Annihilator Homing	Homing Arrow DMG +50%.	1	Normal	2	b1dd6f43-3f20-4a90-8b89-2c1902f91373	f
3c52b363-7e8a-4c79-b71f-9b13514ab372	\N	b745cb95-0126-4fa0-95e6-1f13f7cb58b3	Ice Burst Bullet	Ice Light Bullets Have a 50% Chance to Create an Ice Explosion on Hit	1	Premium	3	09b57a99-2a08-4cc2-84ab-adb8b470cd5f	f
6f7d41b0-ef54-4cfe-a8ee-056ad3591fe5	\N	\N	DMG Boost	DMG +60%	1	Normal	5	b1dd6f43-3f20-4a90-8b89-2c1902f91373	t
9d32bf7f-2eba-4ede-8600-0273753ca66f	\N	e2b2c80c-e0e7-4f0f-ab74-12f56fffe9d1	Reload DMG Boost	Attack +100% during Reload for 1 second.	3	Premium	1	151659eb-87bc-4f27-959f-e6ba974b1b32	f
4b522626-fc89-4e2a-95d1-ffed47b1ee88	\N	\N	Bounce	Bullet bounce +1.	5	Normal	5	151659eb-87bc-4f27-959f-e6ba974b1b32	f
f642f7ca-90c5-41c7-8449-f4e0f2c4a9e7	\N	4b522626-fc89-4e2a-95d1-ffed47b1ee88	Bounce	After each bounce, bullet DMG +50%.	5	Normal	0	151659eb-87bc-4f27-959f-e6ba974b1b32	f
241f51ee-e767-41db-a943-1044289fc042	\N	\N	DMG Boost	DMG +60%	1	Normal	6	151659eb-87bc-4f27-959f-e6ba974b1b32	t
58304f3f-73d5-41dc-963b-bb4db565f710	\N	\N	Trap Creation	When enemies are killed there is a 20% chance to leave a Mechanical Trap	5	Premium	6	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
c147a7d8-cd86-433f-b370-fb3ecfd369f9	\N	58304f3f-73d5-41dc-963b-bb4db565f710	Fast Crafting	Mechanical Trap trigger chance doubled	1	Premium	0	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
69159a13-873a-459b-9cde-a294a12a3eeb	\N	58304f3f-73d5-41dc-963b-bb4db565f710	Trap DMG Increased	Mechanical Trap DMG +50%	1	Normal	1	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	f
a5f2feb6-d672-4478-baae-f1993cf53453	\N	\N	DMG Boost	DMG +60%	1	Normal	7	4bcd47f4-b6ca-4ce4-9594-d633b7a44d4b	t
a70c1348-13ae-44c7-9d65-c62ff1f20d52	\N	\N	Projectile Boost	Projectile +1.	1	Normal	0	6f00a69b-014d-4006-828e-d13e9540de88	f
6d3d1be3-9842-4b44-be1b-1cd2fe40b1e0	\N	a70c1348-13ae-44c7-9d65-c62ff1f20d52	Projectile Boost	Projectile +1.	1	Normal	0	6f00a69b-014d-4006-828e-d13e9540de88	f
2d2ad2a3-80a7-4ca7-87a9-22bb3ea2f8f1	\N	a70c1348-13ae-44c7-9d65-c62ff1f20d52	Multiple ballistics	Every 2 attacks, next attack projectile +7.	1	Premium	1	6f00a69b-014d-4006-828e-d13e9540de88	f
f95f728c-3167-48bd-8c56-f8ea5479b9c7	\N	\N	Link – Fire	[Mech Nezha][Firethrower] executes enemies with HP < 20%.	1	Premium	1	6f00a69b-014d-4006-828e-d13e9540de88	f
71bebeaa-fbd7-4b39-8906-52c8f4c86d8d	\N	\N	Cosmic Ribbon	Release a Cosmic Ribbon every 20s.	3	Premium	2	6f00a69b-014d-4006-828e-d13e9540de88	f
ee7f42a9-bb74-4e60-9c26-e6d8d8e7268f	\N	71bebeaa-fbd7-4b39-8906-52c8f4c86d8d	Continuous Attack	Cosmic Ribbon Duration +2s.	3	Normal	0	6f00a69b-014d-4006-828e-d13e9540de88	f
3d27632c-fd4e-49de-94b7-655c6081ea7c	\N	ee7f42a9-bb74-4e60-9c26-e6d8d8e7268f	Cosmic Ribbon	Cosmic Ribbon Duration +4s.	3	Premium	0	6f00a69b-014d-4006-828e-d13e9540de88	f
f28c0b72-a06a-4abd-a3d6-7e3fe31fbbf3	\N	71bebeaa-fbd7-4b39-8906-52c8f4c86d8d	\N	Evolve into Rainbow Ribbon, Range +100%, DMG +100%.	3	Core	1	6f00a69b-014d-4006-828e-d13e9540de88	f
ccbe91fd-a19d-4d3a-a0a2-a5956cc3cca0	\N	71bebeaa-fbd7-4b39-8906-52c8f4c86d8d	DMG Boost	Cosmic Ribbon DMG +50%.	3	Normal	2	6f00a69b-014d-4006-828e-d13e9540de88	f
ad3d2996-50a1-4fd7-9c2a-a6ad64e17444	\N	\N	Burning	100% chance to cause Burning when hitting an enemy.	3	Normal	3	6f00a69b-014d-4006-828e-d13e9540de88	f
52ee8dc9-5742-4c1d-ae4b-602b7743dd3d	\N	ad3d2996-50a1-4fd7-9c2a-a6ad64e17444	Burning DMG Boost	DMG +10% for every 80 Burning inflicted on enemies (max 150%).	3	Premium	0	6f00a69b-014d-4006-828e-d13e9540de88	f
3766f01f-5be9-401d-9e1b-9851f3aa6e2c	\N	\N	Cosmic Ring	Every 15 attacks, throw 3 Cosmic Rings.	5	Premium	4	6f00a69b-014d-4006-828e-d13e9540de88	f
bd6d49bf-518f-4570-8dda-94b320d01c58	\N	\N	Backup Magazine	Mag +2	1	Normal	0	06d09d71-5fbd-4a4b-8835-183859db026a	f
fedaea1b-fb32-48d7-a998-b2c1975c06da	\N	bd6d49bf-518f-4570-8dda-94b320d01c58	Backup Magazine	Mag +3	1	Normal	0	06d09d71-5fbd-4a4b-8835-183859db026a	f
098abc9e-b758-45dd-92e6-55bff2b4f46e	\N	bd6d49bf-518f-4570-8dda-94b320d01c58	Mag Upgrade	Mag +3, Fire Rate +30%, Reload Speed +50%	1	Premium	1	06d09d71-5fbd-4a4b-8835-183859db026a	f
5b385ee8-3430-4f81-bd34-a0735eaac4fd	\N	\N	\N	Basic Fireball Size +50%, DMG to ignited enemies +150%	1	Core	1	06d09d71-5fbd-4a4b-8835-183859db026a	f
008fc06e-0348-4a21-b962-c895d50bd9ad	\N	\N	Fire Missile	Fires 6 Fire Missiles every 4 shots. Leaves a Small Fire after explosion	1	Premium	2	06d09d71-5fbd-4a4b-8835-183859db026a	f
7e3615d0-59bc-4188-ba65-ab975347eef2	\N	008fc06e-0348-4a21-b962-c895d50bd9ad	Missile DMG Boost	Fire Missile DMG +50%	1	Premium	0	06d09d71-5fbd-4a4b-8835-183859db026a	f
f9762e67-446b-43a6-ba58-41aa3a17a4e9	\N	008fc06e-0348-4a21-b962-c895d50bd9ad	Double Missiles	Fire Missile Count +100%	1	Normal	1	06d09d71-5fbd-4a4b-8835-183859db026a	f
04e35e76-945c-4885-abab-6a60fccfaa9c	\N	\N	Fire Explosion	50% chance to trigger a Fire Explosion on kill	3	Premium	3	06d09d71-5fbd-4a4b-8835-183859db026a	f
de9964fe-2ee4-4eed-8a0f-ca2a287e7e1e	\N	04e35e76-945c-4885-abab-6a60fccfaa9c	Probability Boost	75% chance to trigger a Fire Explosion	3	Normal	0	06d09d71-5fbd-4a4b-8835-183859db026a	f
ebd251f9-41f7-4815-a5bf-f7a6a58eb4db	\N	04e35e76-945c-4885-abab-6a60fccfaa9c	Explosion Residue	Fire Explosion leaves a Small Fire	3	Normal	1	06d09d71-5fbd-4a4b-8835-183859db026a	f
8a6aa873-8c97-40bd-be66-9f631dab251a	\N	04e35e76-945c-4885-abab-6a60fccfaa9c	Super Fire	Small Fire has a 50% chance to ignite enemies	3	Normal	2	06d09d71-5fbd-4a4b-8835-183859db026a	f
dcc1d7b6-aa67-4c97-9a62-92a6731f3a03	\N	04e35e76-945c-4885-abab-6a60fccfaa9c	\N	Recalls all nearby active Small Fires every 5s	3	Core	3	06d09d71-5fbd-4a4b-8835-183859db026a	f
4c31906d-4ee1-48db-adcd-ac7671179540	\N	\N	Splash Fireball	30% chance to splash a Small Fireball on hit. Leaves a Small Fire after vanishing	5	Premium	4	06d09d71-5fbd-4a4b-8835-183859db026a	f
1d004003-cd54-4168-b678-e6bb543cb462	\N	4c31906d-4ee1-48db-adcd-ac7671179540	Probability Boost	60% chance to splash a Small Fireball	5	Premium	0	06d09d71-5fbd-4a4b-8835-183859db026a	f
d81c890c-43d5-4bb9-a874-639cb0ac31eb	\N	4c31906d-4ee1-48db-adcd-ac7671179540	Explosive Fireball	Small Fireball has a 100% chance to ignite enemies	5	Normal	1	06d09d71-5fbd-4a4b-8835-183859db026a	f
129426a6-0d2a-4f9a-94c0-71bc9328eea5	\N	4c31906d-4ee1-48db-adcd-ac7671179540	Splash DMG Boost	Small Fireball DMG +50%	5	Normal	2	06d09d71-5fbd-4a4b-8835-183859db026a	f
bfe95c19-f344-4446-9294-8f51dd495850	\N	\N	Fire Rate Growth	Fire Rate +10% per 100 kills (Max 12 stacks)	5	Premium	5	06d09d71-5fbd-4a4b-8835-183859db026a	f
d5dcd4aa-ca95-4db5-8d7d-05b9255c257f	\N	\N	DMG Growth	DMG +15% per 100 kills (Max 12 stacks)	5	Premium	6	06d09d71-5fbd-4a4b-8835-183859db026a	f
49fe8f18-b925-4bf3-bd22-8d4e1fafedc0	\N	\N	DMG Boost	DMG +60%	1	Normal	7	06d09d71-5fbd-4a4b-8835-183859db026a	t
ff18dd0c-ef58-45f9-b71e-9cc82ddf61a7	\N	\N	Projectile Boost	Left-path projectile +2.	1	Normal	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
ff9073f7-dde5-42de-a274-ce8f26351705	\N	ff18dd0c-ef58-45f9-b71e-9cc82ddf61a7	Projectile Boost	Right-path projectile +2.	1	Normal	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
98ed11e5-56c5-42eb-b6aa-cdc4b29f1aa7	\N	ff9073f7-dde5-42de-a274-ce8f26351705	Projectile Boost	Both-path projectile +2.	1	Premium	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
6d96deec-cc0a-4f28-8426-f81d0c7a31a1	\N	\N	Balance	When projectile count on both sides is equal, DMG +150%.	3	Premium	1	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
0fa0b8fc-ca95-4c38-852f-8f045bfff6fc	\N	\N	Lightning Storm	Every 25 hits on a monster triggers a Lightning Storm.	1	Premium	2	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
2deb1ca8-bb24-4595-ae01-e1f71442cc15	\N	0fa0b8fc-ca95-4c38-852f-8f045bfff6fc	Lightning Paralysis	Lightning Storm has 30% chance to stun enemies.	1	Normal	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
9d62af08-97ea-49b3-ae91-3d5d79d96db4	\N	0fa0b8fc-ca95-4c38-852f-8f045bfff6fc	High Frequency Lightning	Lightning Storm DMG frequency +100%.	1	Normal	1	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
caa9b1d7-e3b5-4e2c-9cf4-0110270d70b3	\N	\N	Crit Hit	Crit Hit rate +1% for each shot (Max 50%). Resets after reload.	3	Normal	3	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
df8e1f3b-324d-4ac1-92cd-b64e66aaac93	\N	caa9b1d7-e3b5-4e2c-9cf4-0110270d70b3	Crit DMG Boost	Crit Hit DMG +100%.	3	Normal	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
e412b382-773a-45bc-abfe-8337f3070a7e	\N	caa9b1d7-e3b5-4e2c-9cf4-0110270d70b3	Critical Electric Current	Crit Hit may trigger Lightning.	3	Premium	1	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
e5f8c017-9898-432a-85eb-48634b83309c	\N	\N	Fire Rate Boost	Fire Rate +50%.	5	Normal	4	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
00f4a7a9-f247-4a49-b5de-7afab6864128	\N	e5f8c017-9898-432a-85eb-48634b83309c	High-Speed Machine Gun	Fire Rate +20%, Mag +20.	5	Normal	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
cbb0f5cb-bc74-4d48-9568-5c23908b7c80	\N	00f4a7a9-f247-4a49-b5de-7afab6864128	Rapid Fire	Fire Rate +1% every shot (Max 120%). Reset after taking DMG.	5	Premium	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
fdf60526-91c3-4a2a-8807-5278865c9e66	\N	cbb0f5cb-bc74-4d48-9568-5c23908b7c80	\N	Fire Rate +100%, Double Mag.	5	Core	0	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
43fe9c12-0b5f-46e0-bc83-2b7e361c9fc7	\N	\N	\N	DMG +100%, Bullet size +100%, Penetration +1.	5	Core	5	66b98c4b-3390-48cc-a95c-fb2b48373acf	f
a88cc191-f0eb-4fa0-ace6-1edac3d3fc4b	\N	\N	DMG Boost	DMG +60%	1	Normal	6	66b98c4b-3390-48cc-a95c-fb2b48373acf	t
d497c72b-e195-434a-b70a-a7ffc1c4d9c5	\N	\N	Projectile Boost	Left Projectile +2	1	Normal	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
e7acebed-aab9-447c-85b5-1c6cdcf7a113	\N	d497c72b-e195-434a-b70a-a7ffc1c4d9c5	Projectile Boost	Right Projectile +2	1	Normal	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
8e2c65d6-6104-4b23-ad73-33123c2f91ef	\N	d497c72b-e195-434a-b70a-a7ffc1c4d9c5	Projectile Boost	Projectiles on both sides +2, Fire Rate +20%	1	Premium	1	98989053-9241-4882-8c1f-e396c7bde0f4	f
0476826f-23da-44b5-bc6a-156a0a806ec7	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
2832e878-438a-4e1d-b79b-2bfc8bb1f786	\N	0476826f-23da-44b5-bc6a-156a0a806ec7	Projectile Boost	Projectile +1	1	Normal	0	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
58d0fffe-0966-4422-82ff-d5574ad6dbdc	\N	0476826f-23da-44b5-bc6a-156a0a806ec7	Stationary Fire	When standing still, Projectile x2	1	Premium	1	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
02f1454f-6862-423d-a4a9-92316b75f897	\N	\N	\N	Fire a Sweeping Laser every 15 shots	1	Core	1	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
ad65dde9-a674-456c-a917-30f8a3b76dc1	\N	\N	Buff Duration	Shielded Shooting Duration +5s	1	Normal	2	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
3f0bec73-fb69-4ab5-a07a-d266e04732d1	\N	\N	Enhance Shooting	Shielded Shooting no longer reduces Movement Speed, DMG +200%	1	Premium	3	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
70e56cfb-78a8-4254-901c-cb5a08dadd0d	\N	\N	\N	Guardian Domain. Gain Guardian Domain Shielded Shooting, attacking enemies and clearing some enemy bullets	1	Core	4	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
57709893-7354-47a1-bb2e-c27ab0d4badd	\N	\N	Starlight Explosion	20% chance to trigger Starlight Blast on hit	3	Premium	5	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
c5f8a030-ab5b-47cc-91b1-0341473ce745	\N	57709893-7354-47a1-bb2e-c27ab0d4badd	Chain Explosion	Starlight Explosion triggers twice, 2nd explosion has larger range	3	Premium	0	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
12c0b701-43b9-4b20-97b6-c1b2770ef9da	\N	57709893-7354-47a1-bb2e-c27ab0d4badd	Starlight DMG	Starlight Explosion applies 30% Vulnerability for 5s	3	Normal	1	1560a1b5-ea7f-47db-8852-cdc6aaea3318	f
7993d363-9ae6-44bb-9224-e56dae9e5473	\N	\N	Link – EM Force	When a bullet hits an enemy within the current ring, there is a 5% chance of triggering a lightning explosion.	1	Premium	1	98989053-9241-4882-8c1f-e396c7bde0f4	f
7403a8ee-7c08-4ebe-8564-e1f8584e1769	\N	\N	Bastion Mode	Stay in place for over 2 seconds to transform into Bastion Mode, doubling firepower, Both Projectiles +1.	1	Premium	2	98989053-9241-4882-8c1f-e396c7bde0f4	f
ec024de4-d55f-4a6e-b6b6-e497f15ddbd0	\N	7403a8ee-7c08-4ebe-8564-e1f8584e1769	Mag Boost	In Bastion mode, Mag *2	1	Premium	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
8eac52aa-bdf3-427d-b012-80459db48caf	\N	7403a8ee-7c08-4ebe-8564-e1f8584e1769	DMG Boost	In Bastion Mode, DMG +150%	1	Premium	1	98989053-9241-4882-8c1f-e396c7bde0f4	f
49cca5b1-14d5-4261-a533-90ae19c198cb	\N	7403a8ee-7c08-4ebe-8564-e1f8584e1769	Bastion DMG Reduction	In Bastion mode, DMG Reduction +30%	1	Normal	2	98989053-9241-4882-8c1f-e396c7bde0f4	f
5ec5f6b3-e8df-46c3-881d-f1069f31d5d7	\N	\N	Electric Swirl	3% chance to trigger Electric Swirl on hit.	3	Premium	3	98989053-9241-4882-8c1f-e396c7bde0f4	f
5e333775-2988-4131-9b77-11779c016682	\N	3766f01f-5be9-401d-9e1b-9851f3aa6e2c	Increased Quantity	Cosmic Ring +3.	5	Premium	0	6f00a69b-014d-4006-828e-d13e9540de88	f
278e16e3-31b0-4593-b431-a71f229f75d0	\N	3766f01f-5be9-401d-9e1b-9851f3aa6e2c	Cosmic Boomerang	Cosmic Rings return from a distance.	5	Premium	1	6f00a69b-014d-4006-828e-d13e9540de88	f
8f40ca00-1c9f-41cc-b802-bf6179cdb9ea	\N	3766f01f-5be9-401d-9e1b-9851f3aa6e2c	\N	Cosmic Ring leaves a fire trail during flight.	5	Core	2	6f00a69b-014d-4006-828e-d13e9540de88	f
d2116807-d5e2-4ff6-8fec-7767bbb94823	\N	\N	Fire Rate Boost	Fire Rate +60%.	5	Normal	5	6f00a69b-014d-4006-828e-d13e9540de88	f
083cef0c-9745-4074-9a84-1f7eea19fca4	\N	d2116807-d5e2-4ff6-8fec-7767bbb94823	Quick Reload	When shooting while stationary, Reload Speed +500%.	5	Premium	0	6f00a69b-014d-4006-828e-d13e9540de88	f
a1942220-f788-4537-a3eb-5a91c53ff0bc	\N	\N	DMG Boost	DMG +60%	1	Normal	6	6f00a69b-014d-4006-828e-d13e9540de88	t
3b934e0c-b894-4770-a302-37e936a89e6b	\N	\N	Projectile Boost	Projectile +1	1	Normal	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
59d83616-0916-44d8-9d66-071d91f2e375	\N	3b934e0c-b894-4770-a302-37e936a89e6b	Projectile Boost	Projectile +1	1	Normal	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
e580c599-6a18-4330-aad2-4afae8ff49b7	\N	3b934e0c-b894-4770-a302-37e936a89e6b	Projectile Boost	Projectile +1 every 8 shots, resets after reload	1	Premium	1	b8e35f05-f8a3-4e89-a207-be3c79678456	f
3f80eb99-791d-43fc-8f9d-359cad9796ca	\N	\N	link - Energy	10% chance to trigger on Energy Surge on kill	1	Premium	1	b8e35f05-f8a3-4e89-a207-be3c79678456	f
f0adf1a4-28d5-41f6-ba2c-a5df9a3a597e	\N	\N	\N	Small chance to create a Blizzard on kill	1	Core	2	b8e35f05-f8a3-4e89-a207-be3c79678456	f
fa950c45-07a9-4564-8c5b-bcdf748941fd	\N	\N	Ice Burst Trap	Ice Dart has 40% chance to result in Ice Burst Trap on hit	1	Premium	3	b8e35f05-f8a3-4e89-a207-be3c79678456	f
80de617e-b9d0-44fd-b858-31ef6fed44c3	\N	fa950c45-07a9-4564-8c5b-bcdf748941fd	Ice Burst Amplifier	Ice Burst Range +50%	1	Normal	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
4681ae71-2668-4735-861a-f0a4d14d6712	\N	fa950c45-07a9-4564-8c5b-bcdf748941fd	Ice Burst DMG Boost	Ice Burst DMG +50%	1	Normal	1	b8e35f05-f8a3-4e89-a207-be3c79678456	f
58745128-7bbb-4639-b2d1-f7b26dc39e57	\N	\N	Ice Dart	Fire 4 Ice Darts every 8 shots	1	Premium	4	b8e35f05-f8a3-4e89-a207-be3c79678456	f
10f662dc-466a-4fcf-9cd1-09fc2d76cde8	\N	58745128-7bbb-4639-b2d1-f7b26dc39e57	Ice Trap	Ice Dart has 40% chance to result in Ice Burst on hit	1	Premium	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
cd22bde2-5436-4cef-87d8-134e0b276037	\N	58745128-7bbb-4639-b2d1-f7b26dc39e57	Persistent Freeze	Ice Trap Duration +50%	1	Normal	1	b8e35f05-f8a3-4e89-a207-be3c79678456	f
d8a16304-87d2-4e31-925c-dce6670136dd	\N	58745128-7bbb-4639-b2d1-f7b26dc39e57	Freeze DMG Boost	Ice Trap DMG to frozen enemies +100%	1	Normal	2	b8e35f05-f8a3-4e89-a207-be3c79678456	f
62314c14-49a1-45b6-86fc-aeb966f4c4a7	\N	58745128-7bbb-4639-b2d1-f7b26dc39e57	Multi-Dart	Doubles Ice Dart count	1	Premium	3	b8e35f05-f8a3-4e89-a207-be3c79678456	f
a5a93972-5338-449c-a3ad-604a54199cd0	\N	\N	\N	All Darts create an extra Ice Burst on hit	1	Core	5	b8e35f05-f8a3-4e89-a207-be3c79678456	f
f30f6a32-9016-4f80-b1c7-2ae700fa20f0	\N	\N	Boomerang	3 Boomerangs are released every 10s	3	Premium	6	b8e35f05-f8a3-4e89-a207-be3c79678456	f
c5c8e65a-cab2-4041-8fc2-98883a35e252	\N	f30f6a32-9016-4f80-b1c7-2ae700fa20f0	Boomerang DMG Boost	Boomerang DMG +50%	1	Normal	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
ff2bf6ef-f94a-4571-a283-61fd59304165	\N	f30f6a32-9016-4f80-b1c7-2ae700fa20f0	Multi-Dart	Boomerang Dart count +1	1	Normal	1	b8e35f05-f8a3-4e89-a207-be3c79678456	f
086ff923-7672-441c-a36a-5fda69bd468e	\N	f30f6a32-9016-4f80-b1c7-2ae700fa20f0	Persistent Boomerang	Boomerang flight time increased	1	Premium	2	b8e35f05-f8a3-4e89-a207-be3c79678456	f
bfb95d60-c26f-4909-a464-f737c29a4ddc	\N	\N	Fire Rate Boost	Fire Rate +50%	5	Normal	7	b8e35f05-f8a3-4e89-a207-be3c79678456	f
7f28d511-5742-4aa7-a6b3-93e3d085fed5	\N	bfb95d60-c26f-4909-a464-f737c29a4ddc	Fire Rate Boost	Fire Rate +100% Mage +100%	1	Premium	0	b8e35f05-f8a3-4e89-a207-be3c79678456	f
cf5de5e0-d708-4669-8314-73307a7d1443	\N	\N	Quick Reload	When Elite/BOSS appears, Reload Speed +100% for 30s	5	Normal	8	b8e35f05-f8a3-4e89-a207-be3c79678456	f
0c112d9a-d6dc-4289-97c7-27d542b1069f	\N	\N	DMG Boost	DMG +60%	1	Normal	9	b8e35f05-f8a3-4e89-a207-be3c79678456	t
2540ef8e-7724-4cda-85ef-c22fcefe5de5	\N	5ec5f6b3-e8df-46c3-881d-f1069f31d5d7	Chance Boost	Electric Swirl trigger chance doubled.	3	Premium	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
c6c37445-814f-4583-bbba-c2b803d45188	\N	5ec5f6b3-e8df-46c3-881d-f1069f31d5d7	DMG Boost	Electric Swirl DMG +50%	3	Normal	1	98989053-9241-4882-8c1f-e396c7bde0f4	f
a9e23a18-86ca-4f8d-97b4-777626a3eeaf	\N	5ec5f6b3-e8df-46c3-881d-f1069f31d5d7	Swirl Paralysis	Electric Swirl triggers Paralysis.	3	Normal	2	98989053-9241-4882-8c1f-e396c7bde0f4	f
2d4406bf-733a-40b9-94d4-42f979753947	\N	\N	\N	Destruction Swirl: When killing enemies within 5 meters, there is a 20% chance to trigger an Electric Swirl.	3	Core	4	98989053-9241-4882-8c1f-e396c7bde0f4	f
b711e471-d778-4454-8da6-440090fb391c	\N	\N	Crit Hit Boost	Crit Rate +2% for each shot (Max 50%) Resets after reload	3	Premium	5	98989053-9241-4882-8c1f-e396c7bde0f4	f
61f92683-9287-46f4-83b0-f5567bc4ede8	\N	b711e471-d778-4454-8da6-440090fb391c	Reload Boost	Reload speed +10% for each Crit Hit (Max 200%) Resets after reload	3	Normal	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
88872e25-d4f1-4fab-bc43-b913d5932c51	\N	b711e471-d778-4454-8da6-440090fb391c	Crit DMG Boost	Crit DMG +6% for each shot Resets after reload	3	Premium	1	98989053-9241-4882-8c1f-e396c7bde0f4	f
87ef3dce-b2bf-4c2d-a195-ab2e258ee934	\N	\N	\N	Bullet Penetration +2, DMG +100%	3	Core	6	98989053-9241-4882-8c1f-e396c7bde0f4	f
1b4dc647-193a-446a-b040-4e01f8c5f0a0	\N	\N	Fire Rate Boost	Fire Rate +50%	5	Normal	7	98989053-9241-4882-8c1f-e396c7bde0f4	f
9e618a37-6695-4f7a-abc3-c9612e5cb97b	\N	1b4dc647-193a-446a-b040-4e01f8c5f0a0	Fire Rate Boost	Fire Rate +50%, Mag +10	5	Premium	0	98989053-9241-4882-8c1f-e396c7bde0f4	f
e6ac25c5-d4d6-4cce-95de-ba81eccaab2c	\N	\N	DMG Boost	DMG +60%	1	Normal	8	98989053-9241-4882-8c1f-e396c7bde0f4	t
26b77a93-1b38-43ce-a9cb-4628cf326f2f	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Attack Mode	Enter Attack Mode. Track Enemies. Continuous Fire +1	1	Premium	0	\N	f
16bbcda5-9426-40b3-a0d7-2b88e5d076c0	bbb0942b-f51d-4190-9689-17d2bc946ba9	26b77a93-1b38-43ce-a9cb-4628cf326f2f	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
18b5c81d-4e1c-4178-95ac-c0e0d4e387b0	bbb0942b-f51d-4190-9689-17d2bc946ba9	16bbcda5-9426-40b3-a0d7-2b88e5d076c0	Continuous Fire	Continuous Fire +2	1	Premium	0	\N	f
599b80cf-28b1-4aa1-b559-e3a4e2ebce41	bbb0942b-f51d-4190-9689-17d2bc946ba9	26b77a93-1b38-43ce-a9cb-4628cf326f2f	\N	Continuous Fire x2	1	Core	1	\N	f
9b75c3d2-be08-4553-bc9c-47bb190c529d	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Defense Mode	Enter Defense Mode. Follow the Mech. Range +50%	1	Premium	1	\N	f
94636dab-d929-42f4-a58f-ca1f98e20cdf	bbb0942b-f51d-4190-9689-17d2bc946ba9	9b75c3d2-be08-4553-bc9c-47bb190c529d	Range Boost	Range +50%	1	Normal	0	\N	f
6e7069c2-2429-4f77-9a9d-751b995943a4	bbb0942b-f51d-4190-9689-17d2bc946ba9	94636dab-d929-42f4-a58f-ca1f98e20cdf	Range Boost	Range +100%	1	Premium	0	\N	f
04007051-2afb-49cd-acd7-e60ccfae8fb5	bbb0942b-f51d-4190-9689-17d2bc946ba9	9b75c3d2-be08-4553-bc9c-47bb190c529d	\N	CD speed +100%	1	Core	1	\N	f
90833cf1-a1e7-496a-b375-3a1662600c33	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Freeze	50% Chance to freeze enemies	3	Normal	2	\N	f
81cbc868-d6c3-4feb-b59e-8263d809596a	bbb0942b-f51d-4190-9689-17d2bc946ba9	90833cf1-a1e7-496a-b375-3a1662600c33	Ice Shard DMG Boost	DMG to frozen enemies +100%	3	Normal	0	\N	f
7f49dfcf-d29a-4629-9791-f193a14d2d30	bbb0942b-f51d-4190-9689-17d2bc946ba9	90833cf1-a1e7-496a-b375-3a1662600c33	Ice Spike	Triggers Ice Spikes when monsters are frozen	3	Normal	1	\N	f
e7cbf304-4094-4592-a7f7-c87bd51154bf	bbb0942b-f51d-4190-9689-17d2bc946ba9	7f49dfcf-d29a-4629-9791-f193a14d2d30	Ice Spike Boost	Ice Spikes Range +100%	3	Normal	0	\N	f
7a1a3559-b753-4bc1-956f-b43195eee04a	bbb0942b-f51d-4190-9689-17d2bc946ba9	7f49dfcf-d29a-4629-9791-f193a14d2d30	Ice Spike DMG Boost	Ice Spikes DMG +100%	3	Normal	1	\N	f
4f1a77d2-aed9-4f7e-b431-2891f6961061	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Ice DMG Boost	Ice DMG +50%	3	Normal	3	\N	f
934df8c1-2192-4639-a0e3-944edc47934f	bbb0942b-f51d-4190-9689-17d2bc946ba9	4f1a77d2-aed9-4f7e-b431-2891f6961061	Ice DMG Boost	Ice DMG +100%	3	Premium	0	\N	f
f7e399a2-7313-4f24-90f0-c9ec971809b3	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	High Frequency DMG	DMG frequency +100%	5	Premium	4	\N	f
d859b6db-3591-43ef-a8cf-b7d3a95973a3	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Endurance Boost	Duration +50%	5	Normal	5	\N	f
02f26a02-5db1-4075-860b-857c0daa15af	bbb0942b-f51d-4190-9689-17d2bc946ba9	d859b6db-3591-43ef-a8cf-b7d3a95973a3	Endurance Boost	Duration +100%	5	Premium	0	\N	f
04570ade-97d2-4d75-8d91-50b539b90ed1	bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	DMG Boost	DMG +50%	1	Normal	6	\N	t
c8b35b7e-495b-4c99-9654-c17f828cd8c0	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Range Boost	Laser Length +60%	1	Normal	0	\N	f
98dbaa7c-4a63-4f52-adfa-c502bba372c9	2eecd419-48f2-4016-bbb8-89ce167501aa	c8b35b7e-495b-4c99-9654-c17f828cd8c0	Range Boost	Laser Length +60%	1	Normal	0	\N	f
c488cc35-6803-455e-959e-4fab8ec06b35	2eecd419-48f2-4016-bbb8-89ce167501aa	98dbaa7c-4a63-4f52-adfa-c502bba372c9	Range Boost	Laser Length +120%	1	Premium	0	\N	f
96c4300d-de59-4cec-b835-f12fed93773c	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	\N	Firing two lasers at once	1	Core	1	\N	f
ae18fe06-6db0-4f09-b6c2-d59bc024c4c6	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	\N	Evolve into Extreme Cold Laser. DMG +100%	1	Core	2	\N	f
e24d3469-f31f-4723-9203-d4d1001be4a6	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Charge	Laser DMG +10% for every 50 enemies killed (max 80%)	1	Normal	3	\N	f
1f3f6034-e755-48cf-8fe0-ebd44359d89d	2eecd419-48f2-4016-bbb8-89ce167501aa	e24d3469-f31f-4723-9203-d4d1001be4a6	Charge	Laser duration +10% for every 50 enemies killed (max 100%)	1	Premium	0	\N	f
b54c7a35-3c16-4d70-a38c-37aebca27417	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Detonate	Laser explosion upon hitting enemies	1	Premium	4	\N	f
63c81033-6053-4a97-8675-54bfbb02976b	2eecd419-48f2-4016-bbb8-89ce167501aa	b54c7a35-3c16-4d70-a38c-37aebca27417	Explosion DMG Boost	Explosion DMG +50%	1	Normal	0	\N	f
39414c7b-4779-4ca9-829b-febe400641ef	2eecd419-48f2-4016-bbb8-89ce167501aa	b54c7a35-3c16-4d70-a38c-37aebca27417	Explosion Range	Explosion Range +50%	1	Normal	1	\N	f
c21e7f6a-58ce-43fa-a230-2a96d3db67de	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Spray	Laser DMG +20%. Conducts small area sweep	3	Normal	5	\N	f
6f04ce2f-5764-41e5-8f0c-c02d0c121b49	2eecd419-48f2-4016-bbb8-89ce167501aa	c21e7f6a-58ce-43fa-a230-2a96d3db67de	Spray Boost	Laser DMG +40%. Increase sweep Range	3	Premium	0	\N	f
a0815d61-b2e9-4d55-9546-2a7d3e317473	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Light Trail	Leaves behind [Light Trace] that DMGs enemies when laser disappears	3	Normal	6	\N	f
0c89dda4-5095-4c54-b699-d585a55b1ca6	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Projectile Boost	Laser Count +1.	1	Normal	0	\N	f
417fe9b4-a690-4009-afde-73573a043870	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	0c89dda4-5095-4c54-b699-d585a55b1ca6	Projectile Boost	Laser Count +1.	1	Normal	0	\N	f
d41661b6-57b4-4535-aab3-ff484869d4b8	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	417fe9b4-a690-4009-afde-73573a043870	Projectile Boost	Laser Count +2.	1	Premium	0	\N	f
a9e3be05-e2e2-4fca-8e16-029a51c6507c	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	\N	Laser kills target, generates a spreading ice ring.	1	Core	1	\N	f
4a8f8a17-4ddc-4030-ad31-303b40ca7ead	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	\N	Evolve into Future Beam, DMG +100%, Range +100%.	1	Core	2	\N	f
380dac82-aa11-45d9-b5bf-b3b6ef6f4deb	c318dde8-fc44-4702-875c-19b038ba80c2	a18e3227-025c-46ac-a159-782acde35a8f	DMG Boost	Fire Residue DMG +50%	1	Normal	1	\N	f
c54a6caf-1645-40f3-9948-1f2457a64a74	c318dde8-fc44-4702-875c-19b038ba80c2	a18e3227-025c-46ac-a159-782acde35a8f	Immolate	Fire Residue hits inflict Immolation on enemies.	1	Normal	2	\N	f
7ad10045-80ec-49aa-a531-a3674739780c	c318dde8-fc44-4702-875c-19b038ba80c2	\N	Continuous Burn	Gourd Duration +50%	3	Normal	4	\N	f
cf8864c5-7ffc-423b-80bc-1c41f7bfb731	c318dde8-fc44-4702-875c-19b038ba80c2	7ad10045-80ec-49aa-a531-a3674739780c	Continuous Burn	Gourd Duration +100%	3	Premium	0	\N	f
85888c11-1db5-44be-bade-5e69f23761a3	c318dde8-fc44-4702-875c-19b038ba80c2	7ad10045-80ec-49aa-a531-a3674739780c	DMG Growth	Gourd DMG +30% every 1s (max 180%)	3	Premium	1	\N	f
c6bfa75c-9749-48cb-a391-4e673abf2632	c318dde8-fc44-4702-875c-19b038ba80c2	\N	Lure Program	Gourd lure monsters closer once every second.	3	Premium	5	\N	f
7e701822-943b-4d92-8737-829bd16056b3	c318dde8-fc44-4702-875c-19b038ba80c2	c6bfa75c-9749-48cb-a391-4e673abf2632	Range Boost	Lure Range +50%	3	Normal	0	\N	f
6d4c826d-fe06-4350-b143-50721f68a053	c318dde8-fc44-4702-875c-19b038ba80c2	c6bfa75c-9749-48cb-a391-4e673abf2632	Binding Pull	Slows minions after luring them close.	3	Normal	1	\N	f
fb157e0f-ac53-4e3d-a47c-60701a068aab	c318dde8-fc44-4702-875c-19b038ba80c2	\N	Small Fireball	Randomly fires Small Fireballs while Gourd is active.	5	Premium	6	\N	f
d9c121bd-6854-463a-b0ac-224df7c73ce0	c318dde8-fc44-4702-875c-19b038ba80c2	fb157e0f-ac53-4e3d-a47c-60701a068aab	DMG Boost	Small Fireball DMG +50%	5	Normal	0	\N	f
77528276-0f6e-4b8d-9f92-e42cb5c1793c	c318dde8-fc44-4702-875c-19b038ba80c2	fb157e0f-ac53-4e3d-a47c-60701a068aab	Increased Quantity	Small Fireball quantity doubled	5	Premium	1	\N	f
5510ffc1-7056-471d-a7c6-67499cb7e151	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Refraction	Evolution to hit target with 50% chance of refraction.	1	Premium	3	\N	f
5a2beb9d-ca33-4ad2-b4bd-07cba895b496	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	5510ffc1-7056-471d-a7c6-67499cb7e151	Refraction DMG Boost	Refraction DMG +50%.	1	Normal	0	\N	f
31c9b433-88b3-4ebf-8dfd-c3a8589345ad	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	5510ffc1-7056-471d-a7c6-67499cb7e151	Refraction Light Trace	Refraction Laser creates Light Traces upon disappearing.	1	Premium	1	\N	f
2b28452f-e15a-4c22-9f5b-5d5910254da0	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	5510ffc1-7056-471d-a7c6-67499cb7e151	Refraction Ice Trace	Evolve into Ice Trace, add Freeze effect.	3	Premium	2	\N	f
dc95fe53-c212-4305-9d76-2f1f632dcef8	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Freezing Beam	Laser has 100% chance to freeze enemies.	3	Premium	4	\N	f
f6ef6433-cd29-4c9c-8094-8bb6e89cc5f3	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	dc95fe53-c212-4305-9d76-2f1f632dcef8	Ice Spike	Deal DMG to frozen targets and trigger Ice Spike.	3	Premium	0	\N	f
c902c2c3-36b6-428e-8e40-fe64247725a4	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	f6ef6433-cd29-4c9c-8094-8bb6e89cc5f3	Ice Spike DMG Boost	Ice Spike DMG +50%.	3	Normal	0	\N	f
aa3661ee-c450-4034-87f3-6587dabaa0ab	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	f6ef6433-cd29-4c9c-8094-8bb6e89cc5f3	Ice Spike Boost	Ice Spike Range +100%.	3	Premium	1	\N	f
a0cc537c-9708-4f93-851f-43917ea468c4	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Energy Detonation	Hit enemy has 50% chance to explode.	5	Normal	5	\N	f
1bfdb9ce-4477-498b-8e01-4e8da6bcacf3	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	a0cc537c-9708-4f93-851f-43917ea468c4	Extra DMG Boost	Explosion deals 3x DMG to vulnerable targets.	5	Premium	0	\N	f
8bd3eb6d-5c07-4600-91ab-0fe407583c09	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Firepower Suppression	DMG to Small Monsters +100%.	3	Premium	6	\N	f
7e28d8eb-a53b-4d98-918f-5dee42ad3d79	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Emergency Cooldown	Cooldown Speed +100% when Zombie Wave incoming (lasting 60 Sec).	5	Premium	7	\N	f
bb54e574-e8ae-4309-9bc3-84b12bd2ff8b	bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Boost DMG	DMG +60%	1	Normal	8	\N	t
9ca9de7d-915e-4dac-9117-2c1860e8c4de	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
77751d7b-5023-4245-bce9-c8c50048783c	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	9ca9de7d-915e-4dac-9117-2c1860e8c4de	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
5927ba76-3b26-4743-bea9-b904cc1381da	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	77751d7b-5023-4245-bce9-c8c50048783c	Continuous Fire	Continuous Fire +2	1	Premium	0	\N	f
ec346d3d-ccd2-424f-8a47-1901c7742bec	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	\N	Upgrade to super large drill with much higher DMG	1	Core	1	\N	f
e029571c-90da-4cda-a777-5d815a5779e0	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Ice Storm	Create an Ice Storm when killing any enemies	1	Normal	2	\N	f
f921b0e6-c4f0-4e47-b7f1-85b255f84ad4	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	e029571c-90da-4cda-a777-5d815a5779e0	Ice Storm Range	Ice Storm Range +100%	1	Normal	0	\N	f
aa2da858-92b6-487d-8a02-841437b46c41	c318dde8-fc44-4702-875c-19b038ba80c2	fb157e0f-ac53-4e3d-a47c-60701a068aab	Bounce Boost	Small Fireball Bounce +1	5	Normal	2	\N	f
6d3a94ef-b079-4daa-97c3-2aa9fb7d1f29	c318dde8-fc44-4702-875c-19b038ba80c2	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
a1cf3a36-9aeb-47ca-9b6f-5963f8b95ef7	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Increased Size	Size +50%	1	Normal	0	\N	f
3a834efd-7244-4f68-927d-b2c7ccd22e6b	b6b16974-943e-439d-b8ea-5c9a819812bf	a1cf3a36-9aeb-47ca-9b6f-5963f8b95ef7	Increased Size	Size +50%	1	Normal	0	\N	f
0fef3f8d-2b0e-4ea6-a66a-9e0156535194	b6b16974-943e-439d-b8ea-5c9a819812bf	3a834efd-7244-4f68-927d-b2c7ccd22e6b	Increased Size	Size +100%	1	Premium	0	\N	f
1e396eae-6adc-4b73-9757-e06a123fe46f	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	\N	Evolve into a giant Chain Ball. DMG +100%. Size +100%	1	Core	1	\N	f
3cea2d34-8466-4914-8952-860a95167737	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Spike	Chain Ball Fire spikes when hitting an enemy	1	Premium	2	\N	f
9cb1c7c1-c9f3-4ad7-9e17-7858ddf321fa	b6b16974-943e-439d-b8ea-5c9a819812bf	3cea2d34-8466-4914-8952-860a95167737	Spike DMG Boost	Spike DMG +100%	1	Normal	0	\N	f
54b99ddd-8339-4ff0-a293-fda9a05a7cd0	b6b16974-943e-439d-b8ea-5c9a819812bf	3cea2d34-8466-4914-8952-860a95167737	Spike Size Increase	Spike size +100%	1	Normal	1	\N	f
951e24f0-f2d0-4812-8ec8-495c094db63a	b6b16974-943e-439d-b8ea-5c9a819812bf	3cea2d34-8466-4914-8952-860a95167737	Trigger Lightning	50% chance to trigger lightning when spikes hit an enemy	1	Premium	2	\N	f
00d73010-d79b-4114-97c5-40d3af183756	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	e029571c-90da-4cda-a777-5d815a5779e0	Ice Storm DMG Boost	Ice Storm DMG +100%	1	Normal	1	\N	f
f85710d0-770f-407c-8d37-1dfba1626826	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	Increased Quantity	Ice Pillar +1	1	Normal	0	\N	f
1279b1d1-f832-4ca1-93b5-85e5c43137a1	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	f85710d0-770f-407c-8d37-1dfba1626826	Increased Quantity	Ice Pillar +2	1	Normal	0	\N	f
eff28f0c-a20e-4d6e-b36f-5c77e551dceb	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	1279b1d1-f832-4ca1-93b5-85e5c43137a1	Increased Quantity	Ice Pillar +3	1	Premium	0	\N	f
d8a3d81e-b406-418f-916b-02e41cd90a91	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	\N	Fire Ice Spikes in all directions when Snowflakes disappear	1	Core	1	\N	f
cbc30185-bcd8-4e61-8825-553307a23c61	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	\N	Ice Pillars drop twice in a row	1	Core	2	\N	f
902b52d5-5597-4a4d-9636-ebd60c54f93d	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	Snowflake Residue	Dropping Ice Pillars creates Snowflakes, dealing continuous AoE DMG	1	Premium	3	\N	f
a831bb65-eb81-4db9-8267-de31b65525f4	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	902b52d5-5597-4a4d-9636-ebd60c54f93d	Snowflake Duration	Snowflake Duration +2s	1	Normal	0	\N	f
0347b346-35db-4c41-8015-c0c5c0429b8e	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	902b52d5-5597-4a4d-9636-ebd60c54f93d	DMG Boost	Snowflake DMG +50%	1	Normal	1	\N	f
01078568-8dd0-492a-b88f-8919e938b2ad	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	902b52d5-5597-4a4d-9636-ebd60c54f93d	Shattered Snowflake	Trigger an Ice Explosion when the Snowflakes disappear	1	Premium	2	\N	f
46eef2b8-f786-450f-8522-589ccf136fef	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	Ice Spike Splash	Fire Ice Spikes after Ice Pillars drop	3	Premium	4	\N	f
3a032278-5963-41d1-b18c-400979583cce	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	46eef2b8-f786-450f-8522-589ccf136fef	Multiple Ice Spikes	Ice Spike Quantity +100%	3	Premium	0	\N	f
54b8e5c8-9362-4a6c-a24c-36400133c640	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	46eef2b8-f786-450f-8522-589ccf136fef	Freezing Ice Spike	Ice Spikes have 30% chance to freeze enemies	3	Normal	1	\N	f
5956c6d7-27b9-4708-b900-c30483daa2cd	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	46eef2b8-f786-450f-8522-589ccf136fef	DMG Boost	Ice Spike DMG +50%	3	Normal	2	\N	f
13c7fbf2-4d55-4850-ac83-135c5f37f185	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	Ice Pillar	Ice Pillars have a 50% chance to freeze enemies on hit	3	Normal	5	\N	f
11e2ecf3-dd62-4562-9227-18e7ae6a1bb1	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	13c7fbf2-4d55-4850-ac83-135c5f37f185	Ice Pillar	Ice Pillars have a 100% chance to freeze enemies on hit	3	Premium	0	\N	f
e26851d9-27a8-4ea3-810e-34276d137523	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	CD Speed Growth	CD Speed +1% for every 5 enemies killed, max 100%	5	Premium	6	\N	f
aa987a2d-57d8-4dd9-98e6-3c83d45c63e4	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	CD Speed Boost	CD Speed +50%	5	Normal	7	\N	f
7c65c005-c2aa-4baf-ad19-5fc82e67a2df	a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	DMG Boost	DMG +60%	1	Normal	8	\N	t
043f3121-68b8-42f4-b2d7-39a72eb8802c	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Continuous Fire	Continuous Fire +3	1	Normal	0	\N	f
a7ee5e09-b61e-4c1e-958c-6fdcb22e3c0c	deaf8dcf-ced7-405b-8ccd-61c443673c93	043f3121-68b8-42f4-b2d7-39a72eb8802c	Continuous Fire	Continuous Fire +3	1	Normal	0	\N	f
2bd25161-2042-4382-8ca9-05ea983cd433	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	e029571c-90da-4cda-a777-5d815a5779e0	Ice Storm Freeze	Ice Storm freezes enemies on hit	1	Normal	2	\N	f
926ddbbf-c3b9-461f-a753-c72841007b78	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Freeze	Freeze the hit enemies	1	Premium	3	\N	f
dd9c6f20-1ad5-4f3c-8679-f1d3c93855a2	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	926ddbbf-c3b9-461f-a753-c72841007b78	Frostbite	Deal 5% of enemy's max HP as DMG when freezing them	1	Normal	0	\N	f
1b1ace4d-af8d-4c06-9e5b-724581e7c68d	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
12379dcf-9e5c-4247-b3a6-1c7926095bc9	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Ice Scorpion link	Frost Scorpion has a small chance to turn into an Ice Drill	1	Premium	4	\N	f
cc5b7edf-79b6-488f-8013-43be46d6d303	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Drill Split	Splits into 2 small drills after hitting the first enemy	3	Premium	5	\N	f
c4eaaf19-f0f4-43aa-9e1d-04e7ac082417	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	cc5b7edf-79b6-488f-8013-43be46d6d303	Drill Split	Split small drill +2	3	Premium	0	\N	f
f6684d16-b815-4e34-8e23-9fc8d7f5097a	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Screen Bounce	Bounces upon hitting the screen edge	3	Premium	6	\N	f
e730bff2-d363-455a-b15e-35e8513a5409	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	f6684d16-b815-4e34-8e23-9fc8d7f5097a	Bounce Delay	Each bounce +2 secs duration (max 6 secs)	3	Premium	0	\N	f
35a7b79d-8e19-4dd1-80b9-67440290e64d	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Flight Boost	Duration +30%. Flight speed +30%	5	Normal	7	\N	f
ee6db5d8-29b6-47f5-b75c-3405bd9361e6	b991c15e-b21d-4865-bfad-af1fb9a96375	1b1ace4d-af8d-4c06-9e5b-724581e7c68d	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
eca133eb-1740-4c86-b95b-37bbd81b2d0b	b991c15e-b21d-4865-bfad-af1fb9a96375	ee6db5d8-29b6-47f5-b75c-3405bd9361e6	Continuous Fire	Continuous Fire +2	1	Premium	0	\N	f
ad7461a4-2f5b-4e8a-8bf4-806e15fe1bec	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Powerful Buzzsaw	DMG +100%. Hitting an enemy, transforms into a slow Buzzsaw.	1	Premium	1	\N	f
fefd2fdb-2310-4ff2-9334-184c0df70f85	b991c15e-b21d-4865-bfad-af1fb9a96375	ad7461a4-2f5b-4e8a-8bf4-806e15fe1bec	Rotation DMG Boost	Spin DMG +50% per secs (max 150%)	1	Normal	0	\N	f
84a3dcc1-8d6e-480d-a5f1-1ad0cb233a50	b991c15e-b21d-4865-bfad-af1fb9a96375	ad7461a4-2f5b-4e8a-8bf4-806e15fe1bec	Duration	Duration +100%	1	Normal	1	\N	f
8f156bd1-8a5c-4b90-8b33-82995144bf69	b991c15e-b21d-4865-bfad-af1fb9a96375	ad7461a4-2f5b-4e8a-8bf4-806e15fe1bec	\N	Double DMG. Evolve into giant Buzzsaw	1	Core	2	\N	f
9d078a31-91b9-4482-8994-94129e7dc146	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Bouncy Buzzsaw	DMG +100%. Bounce after hitting enemy	1	Premium	2	\N	f
d8107ebd-e3c0-42a4-8603-fb169629cc1c	b991c15e-b21d-4865-bfad-af1fb9a96375	9d078a31-91b9-4482-8994-94129e7dc146	Bounce DMG Boost	Each Bounce DMG +50% (max 150%)	1	Normal	0	\N	f
12b85b49-c570-4171-b2f4-de921bc2cd96	b991c15e-b21d-4865-bfad-af1fb9a96375	9d078a31-91b9-4482-8994-94129e7dc146	Bounce Boost	Bounce times +2	1	Normal	1	\N	f
ea680ffd-da36-4d65-8682-e376cbb12758	b991c15e-b21d-4865-bfad-af1fb9a96375	9d078a31-91b9-4482-8994-94129e7dc146	\N	Double DMG. Infinite Bounces	1	Core	2	\N	f
06e7fc27-215b-4f79-8dcd-9918feb12c0e	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Kill Split	Kill an enemy to split 4 small Buzzsaws	5	Premium	3	\N	f
dfb1fde7-8ca3-4051-84e6-5b987543c841	b991c15e-b21d-4865-bfad-af1fb9a96375	06e7fc27-215b-4f79-8dcd-9918feb12c0e	Split DMG Boost	Small Buzzsaw DMG +100%	5	Normal	0	\N	f
5807d36b-8def-4107-a7e1-0feb6d224b2d	b991c15e-b21d-4865-bfad-af1fb9a96375	06e7fc27-215b-4f79-8dcd-9918feb12c0e	High Frequency Lightning	Small Buzzsaw triggers lightning upon hitting an enemy	5	Premium	1	\N	f
2cd155ab-4a62-4fac-8d0c-0a27b2ba1e8b	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Trigger Lightning	Buzzsaw triggers lightning upon hitting an enemy	3	Normal	4	\N	f
8fa18731-0351-4382-9499-53623e5b2fcb	b991c15e-b21d-4865-bfad-af1fb9a96375	\N	DMG Boost	DMG +50%	1	Normal	5	\N	t
9ba08595-fc75-4649-8ed9-37137dbb9528	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	367e0ab5-ecaa-4552-a435-6af3df0a0db1	Fire Explosion	Fire Circle has a 50% chance to explode upon hitting enemies.	3	Normal	1	\N	f
42b2bc5e-ffce-42bb-b7e4-68eccdde08cd	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	9ba08595-fc75-4649-8ed9-37137dbb9528	Range Boost	Explosion Range +50%.	5	Normal	0	\N	f
6f54effd-b44e-4220-8ae5-2a66de9454e8	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	Burning	Fire Rings have 100% chance to ignite enemies.	5	Premium	5	\N	f
3ba8c7f8-9f76-419f-901c-9ba3262b5ed2	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	6f54effd-b44e-4220-8ae5-2a66de9454e8	Lethal Detonation	Fire Rings always explode when killing ignited enemies.	5	Normal	0	\N	f
b90406e2-3bca-454d-9b23-208a850f5c12	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	DMG Boost	DMG +60%	1	Normal	6	\N	t
e5474ce4-ec89-46ef-95e0-4a0b3538c85d	39490f40-09e2-4c8d-a447-67078ec413eb	cbfd6cd6-46c2-48e7-af8e-ec481bc8adce	Lightning Paralysis	Lightning hits enemy, causing paralysis	3	Normal	1	\N	f
9f57914c-b2d0-4d35-bbd5-6913c7b94a6a	39490f40-09e2-4c8d-a447-67078ec413eb	cbfd6cd6-46c2-48e7-af8e-ec481bc8adce	Giant Lightning	Lightning Range +100%. Lightning DMG +100%	3	Premium	2	\N	f
8fe814d0-ab6d-466c-9e11-9c33d008258b	39490f40-09e2-4c8d-a447-67078ec413eb	\N	DMG Superconduct	DMG +200%. Every 30 secs, decay by 40%	3	Normal	4	\N	f
3f9452cc-0993-4247-ae4b-d84bb29ce1d0	39490f40-09e2-4c8d-a447-67078ec413eb	8fe814d0-ab6d-466c-9e11-9c33d008258b	Cooling Superconduct	CD speed +100%. Every 30 secs, decay by 20%	3	Premium	0	\N	f
8f6e555d-21c7-4430-ae21-62d6aae69179	39490f40-09e2-4c8d-a447-67078ec413eb	3f9452cc-0993-4247-ae4b-d84bb29ce1d0	Critical Overload	Crit Hit Rate +50%. Decreases by 10% every 30 Sec	3	Normal	0	\N	f
acffcdbf-faaf-4fa3-808c-8f2e0536de95	39490f40-09e2-4c8d-a447-67078ec413eb	8fe814d0-ab6d-466c-9e11-9c33d008258b	\N	Restore the Superconduct effect to maximum value, and it will not decay	3	Core	1	\N	f
6f575c48-6897-4e4c-95fb-d425fe3413c1	39490f40-09e2-4c8d-a447-67078ec413eb	\N	Crit Hit Boost	Crit Hit Rate +25%	5	Normal	5	\N	f
7ee1bbb8-eeb4-4230-89c6-ed5bfc787b8f	39490f40-09e2-4c8d-a447-67078ec413eb	6f575c48-6897-4e4c-95fb-d425fe3413c1	Crit Hit Refresh	Crit Hit, small chance to refresh CD	5	Premium	0	\N	f
13919a0e-aa9f-4edb-a857-2ef21e7d9887	39490f40-09e2-4c8d-a447-67078ec413eb	6f575c48-6897-4e4c-95fb-d425fe3413c1	Crit DMG Boost	Crit Hit DMG +100%	5	Normal	1	\N	f
ac7cc884-4c25-414c-ae59-748bc26c2e3d	39490f40-09e2-4c8d-a447-67078ec413eb	\N	DMG Boost	DMG +50%	1	Normal	6	\N	t
9607b3af-fce6-472f-a2f9-1e748bb21a37	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Trigger Lightning	50% chance to trigger lightning when Chain Balls hits an enemy	3	Normal	3	\N	f
a17c03b0-4db4-4574-ae33-07849ac00b7b	b6b16974-943e-439d-b8ea-5c9a819812bf	9607b3af-fce6-472f-a2f9-1e748bb21a37	Lightning DMG Boost	Lightning DMG +100%	3	Normal	0	\N	f
b63e16aa-40e5-4ebb-923d-3239c1d4faac	b6b16974-943e-439d-b8ea-5c9a819812bf	9607b3af-fce6-472f-a2f9-1e748bb21a37	High Frequency Lightning	Chain Balls always trigger lightning	3	Normal	1	\N	f
03598dbe-90f6-43a8-ab53-da0086b95264	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Cripple	Slows enemy for 5 Sec upon hit	3	Normal	4	\N	f
38f36cbe-f4a2-4691-b3b4-5853d7789e86	b6b16974-943e-439d-b8ea-5c9a819812bf	03598dbe-90f6-43a8-ab53-da0086b95264	Knockback Boost	Knockback +100%. 50% chance to stun enemies	3	Premium	0	\N	f
cff8e1ff-8e14-421d-ae20-5017160e81e8	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	CD Reduction	CD speed +25%	5	Normal	5	\N	f
9adf6548-66a0-4293-9e05-6f8b1322d588	b6b16974-943e-439d-b8ea-5c9a819812bf	cff8e1ff-8e14-421d-ae20-5017160e81e8	CD Growth	CD speed +1% for every 10 enemies killed (max 70%)	5	Premium	0	\N	f
23202ab4-86c8-4a21-a3ef-59c35f027e97	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Electric Zone	When the Chain Ball rolls and creates a dense Zap Zone	5	Premium	6	\N	f
1f378ab4-47af-495a-b94c-54f48fafebd0	b6b16974-943e-439d-b8ea-5c9a819812bf	23202ab4-86c8-4a21-a3ef-59c35f027e97	Electric Zone DMG Boost	Lightning field DMG +50%	5	Normal	0	\N	f
3bc3ce44-ba9d-45b9-b391-02f0a2e53114	b6b16974-943e-439d-b8ea-5c9a819812bf	\N	DMG Boost	DMG +50%	1	Normal	7	\N	t
5ea5040c-8152-419e-a675-9902af0284f3	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Increased Quantity	Explosive Gift Box +1	1	Normal	0	\N	f
e57fa8f2-248c-43be-922a-7d679dc8e9ee	29327bc3-3f70-4ee6-943a-884f7a83977c	5ea5040c-8152-419e-a675-9902af0284f3	Increased Quantity	Explosive Gift Box +1	1	Normal	0	\N	f
1224137c-ecf5-4e2d-b1b0-45696eb88acc	29327bc3-3f70-4ee6-943a-884f7a83977c	e57fa8f2-248c-43be-922a-7d679dc8e9ee	Increased Quantity	Explosive Gift Box +2	1	Premium	0	\N	f
a885629e-f0b4-4a49-9505-189dc7de6bd1	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	\N	Sleigh count +1	1	Core	1	\N	f
2f7cea5e-4b64-417b-9d66-39d2393e7fe0	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	\N	Sleigh duration +50%, movement path changed	1	Core	2	\N	f
7a3f8051-c3b6-4cdc-bb3c-5300954855d0	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Surprise Gift	15% chance to generate a new Explosive Gift Box on explosion	1	Premium	3	\N	f
eae9232c-6bca-4633-8963-61ba9cde5550	29327bc3-3f70-4ee6-943a-884f7a83977c	7a3f8051-c3b6-4cdc-bb3c-5300954855d0	Double Surprise	Chance to generate a new Explosive Gift Box doubled	1	Premium	0	\N	f
bd0024cb-1b52-4f5f-95cd-4a87b0b38fc3	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Increased Quantity	Alloy Shield +1	1	Normal	0	\N	f
2e562efe-db8c-4cdc-83b0-67563e3e2a4e	9ee3a9c1-2347-40a4-883a-66aae08273b8	bd0024cb-1b52-4f5f-95cd-4a87b0b38fc3	Increased Quantity	Alloy Shield +1	1	Normal	0	\N	f
7268cfe1-1003-479f-9554-3935b0a6f8c8	9ee3a9c1-2347-40a4-883a-66aae08273b8	2e562efe-db8c-4cdc-83b0-67563e3e2a4e	Increased Quantity	Alloy Shield +2, Knockback +30%	1	Premium	0	\N	f
af67fcc9-d683-4b89-bd70-c8f9197b80f4	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	\N	Alloy Shield Quantity +100%, attacks in different directions.	1	Core	1	\N	f
c425a23f-9f2c-43f4-b45b-7db9cd1f92e7	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Alloy Bullets	Fires 2 Alloy Bullets when the Alloy Shield disappears	1	Premium	2	\N	f
59ad2639-df5d-4358-b3cb-1372f3c6426a	9ee3a9c1-2347-40a4-883a-66aae08273b8	c425a23f-9f2c-43f4-b45b-7db9cd1f92e7	Penetration Boost	Alloy Bullet Penetration +1	1	Premium	0	\N	f
b68d0da1-c74a-4c97-a1a6-2b53c4d94e06	9ee3a9c1-2347-40a4-883a-66aae08273b8	c425a23f-9f2c-43f4-b45b-7db9cd1f92e7	Increased Quantity	Alloy Bullet +2	1	Premium	1	\N	f
0743ad8e-2949-4721-8f05-71e79acfaab1	9ee3a9c1-2347-40a4-883a-66aae08273b8	c425a23f-9f2c-43f4-b45b-7db9cd1f92e7	DMG Boost	Alloy Bullet DMG +50%	1	Normal	2	\N	f
d892a48b-84d2-4144-ae74-d0dc0e7c7739	9ee3a9c1-2347-40a4-883a-66aae08273b8	c425a23f-9f2c-43f4-b45b-7db9cd1f92e7	\N	Alloy Bullet Quantity +100%	1	Core	3	\N	f
e38cd873-d369-4a68-aac9-790c99e515fc	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Shield Bash (Slow)	Hitting an enemy that has been knocked back applies a 40% slow for 5s.	3	Premium	3	\N	f
35878a59-6736-4c18-971a-a1b6f106ac2d	9ee3a9c1-2347-40a4-883a-66aae08273b8	e38cd873-d369-4a68-aac9-790c99e515fc	Slow Special Attack	DMG +100% to Slowed enemies that are knocked back.	3	Premium	0	\N	f
7ed20629-9aed-4936-9cc2-5197dfa41de7	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Shield Bash (Weaken)	Hitting an enemy that has been knocked back applies Weaken, reducing their DMG by 30% for 5s.	3	Normal	4	\N	f
c3bf372e-3398-4233-961c-8ba247b1e9ca	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Shield Crash	50% chance to drop a shield on enemy kill	3	Premium	5	\N	f
d9ca3d7f-96a4-436b-986a-2954601a7378	9ee3a9c1-2347-40a4-883a-66aae08273b8	c3bf372e-3398-4233-961c-8ba247b1e9ca	DMG Boost	Shield Crash DMG +50%	3	Normal	0	\N	f
bf42c308-d788-4528-92b9-7a655724bcf2	9ee3a9c1-2347-40a4-883a-66aae08273b8	c3bf372e-3398-4233-961c-8ba247b1e9ca	Range Boost	Shield Crash Range +50%	3	Normal	1	\N	f
8d599a5a-b111-4188-96a6-e588b60260ef	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Alloy Shield Wall	The Alloy Shield lingers for 3s before disappearing, slightly knocking back nearby enemies.	5	Premium	6	\N	f
579f4624-c6ec-4cc5-b3cd-9ed49c85b867	9ee3a9c1-2347-40a4-883a-66aae08273b8	8d599a5a-b111-4188-96a6-e588b60260ef	Shield Wall (Slow)	Apply 40% Slow on hit while the shield lingers.	5	Normal	0	\N	f
703f0031-8b43-4024-a8a7-025bc92523d4	9ee3a9c1-2347-40a4-883a-66aae08273b8	8d599a5a-b111-4188-96a6-e588b60260ef	Delayed Shield Wall	Alloy Shield Lingers Time +50%	5	Normal	1	\N	f
8ad46eaf-fab7-4c0a-8625-2a6941cfea4e	9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
4d12997f-7efc-46db-b19c-d725e576d0a9	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Multi Slash	Multi Slash +1.	1	Normal	0	\N	f
bf0e8ce2-3da0-4146-8bdb-76554dee589f	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	4d12997f-7efc-46db-b19c-d725e576d0a9	Multi Slash	Multi Slash +1.	1	Normal	0	\N	f
1444584f-543a-4e24-9eae-86a8ba3d0266	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	bf0e8ce2-3da0-4146-8bdb-76554dee589f	Multi Slash	Multi Slash +2.	1	Premium	0	\N	f
eb9e24dd-315c-4c12-affa-526c334210c0	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	\N	Shock Fury Blade, Damage +50%, Multi Slash ×2.	1	Core	1	\N	f
9d1546e8-33cf-4aa4-8a2f-fa896666476c	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	\N	Attacks trigger an extra attack in the opposite direction.	1	Core	2	\N	f
30d15c42-dd7c-4708-ad98-98db7ffd31c2	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Thunder Blade	Every 5 attacks, 3 Thunder Blades fall from the sky nearby.	1	Premium	3	\N	f
19de794d-31b9-4e49-ab8f-039f8d45a58d	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	30d15c42-dd7c-4708-ad98-98db7ffd31c2	Paralyzing Thunder Blade	Thunder Blades have a 100% chance to paralyze enemies on hit.	1	Normal	0	\N	f
e8e16766-0227-46a7-88d4-6cb074f079fb	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	30d15c42-dd7c-4708-ad98-98db7ffd31c2	Spread Thunder Blade	Thunder Blades create expanding Shockwaves on landing.	1	Normal	1	\N	f
fea5082e-bd79-4b4c-90c7-0e73c2fce617	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Range Boost	Range +50%.	3	Normal	4	\N	f
f1164d83-acca-4f8f-836c-2e93deaa3dcd	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	fea5082e-bd79-4b4c-90c7-0e73c2fce617	Range Boost	Range +100%.	3	Premium	0	\N	f
102793ac-4d09-49fe-81ba-2b4035cf15eb	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Slash Thunder Blade	Summon a Thunder Blade Slash nearby every 2s.	3	Premium	5	\N	f
cbc0b029-6ee4-422f-a9ec-e259795dfda1	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	102793ac-4d09-49fe-81ba-2b4035cf15eb	Slash DMG Boost	Thunder Blade DMG +50%.	3	Normal	0	\N	f
0e22bd3d-d6e8-47df-8644-c45070463f93	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	102793ac-4d09-49fe-81ba-2b4035cf15eb	Slash Range Boost	Thunder Blade Range +50%.	3	Normal	1	\N	f
41cec9b6-3a11-4f7c-9af2-8a1226b6c55d	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Azure Lightning	30% chance to trigger Lightning on hit.	5	Normal	6	\N	f
1449d235-6c87-4d66-951d-f0b4629d8c5c	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	41cec9b6-3a11-4f7c-9af2-8a1226b6c55d	Burst Lightning	Guaranteed to trigger Lightning Residue on hit.	5	Premium	0	\N	f
ff7f7735-ee62-4435-b84d-a66ecece34c1	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	41cec9b6-3a11-4f7c-9af2-8a1226b6c55d	Lightning DMG Boost	Lightning DMG +50%.	5	Normal	1	\N	f
326457d9-7368-4246-bf1f-f469ad1e2531	8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
898b9513-843c-4372-94b4-30afc846ece8	29327bc3-3f70-4ee6-943a-884f7a83977c	7a3f8051-c3b6-4cdc-bb3c-5300954855d0	Surprise Upgrade	New Explosive Gift Box explosion DMG +50%	1	Normal	1	\N	f
13d343cb-d31a-4e44-a8a8-79a62d9d9659	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Sleigh Charge	Sleigh applies a 40% slow for 3 seconds	3	Normal	4	\N	f
3ddc47a9-808f-4888-aa86-7ea0c39fc08e	29327bc3-3f70-4ee6-943a-884f7a83977c	13d343cb-d31a-4e44-a8a8-79a62d9d9659	Crippling Charge	Slow effect increased to 60%	3	Normal	0	\N	f
23136196-376e-4a02-bc83-8bac5525deff	29327bc3-3f70-4ee6-943a-884f7a83977c	13d343cb-d31a-4e44-a8a8-79a62d9d9659	Slowing Strike	Sleigh DMG +100% to slowed enemies	3	Premium	1	\N	f
bd10349e-7b29-46f8-9ef8-a829b0f77294	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Explosive Boost	Explosive Gift Box Explosion Range +50%	3	Normal	5	\N	f
649ee0e6-1ed5-4c44-8a1e-a9835b6a0f3c	29327bc3-3f70-4ee6-943a-884f7a83977c	bd10349e-7b29-46f8-9ef8-a829b0f77294	Explosive Boost	Explosive Gift Box Explosion Range +100%	3	Premium	0	\N	f
ae3794d7-af80-4f39-90a2-2e780bc8d1e6	29327bc3-3f70-4ee6-943a-884f7a83977c	bd10349e-7b29-46f8-9ef8-a829b0f77294	Explosive Stun	Explosive Gift Box range +50% and stuns enemies for 1 second	3	Premium	1	\N	f
a2dbd447-b439-4119-b182-6cc0d1134973	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Candy Bomb	30% chance to splash 2 Candy Bombs on Explosive Gift Box explosion	5	Premium	6	\N	f
589efcc3-8cf6-4263-ad46-d61781e00d3e	29327bc3-3f70-4ee6-943a-884f7a83977c	a2dbd447-b439-4119-b182-6cc0d1134973	Double Candy	Candy Bomb count +100%	5	Premium	0	\N	f
fbeb1ae9-74fc-449c-962e-2ddf94b21919	29327bc3-3f70-4ee6-943a-884f7a83977c	a2dbd447-b439-4119-b182-6cc0d1134973	Candy DMG Boost	Candy Bomb DMG +50%	5	Normal	1	\N	f
a61a69de-f73f-41e8-b500-aba94582ea98	29327bc3-3f70-4ee6-943a-884f7a83977c	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
3a0320e6-4a08-40f7-b3f0-bf37b004e261	39490f40-09e2-4c8d-a447-67078ec413eb	\N	Range Boost	Range +60%	1	Normal	0	\N	f
c56f9364-3311-41bf-89eb-b29d01e04fd0	39490f40-09e2-4c8d-a447-67078ec413eb	3a0320e6-4a08-40f7-b3f0-bf37b004e261	Range Boost	Range +60%	1	Normal	0	\N	f
826d34cc-6f5f-4b51-8755-ee2d8da93e8e	39490f40-09e2-4c8d-a447-67078ec413eb	c56f9364-3311-41bf-89eb-b29d01e04fd0	Range Boost	Range +120%	1	Premium	0	\N	f
ad2a1179-b01c-4f85-b150-dcd79b73ad9f	39490f40-09e2-4c8d-a447-67078ec413eb	\N	link - Crit Hit	War Machine: Crit Hit Rate +25%. EM Coil: Crit Hit Rate +25%	1	Premium	1	\N	f
2b80b203-ee78-47fa-b1af-337341c768d7	39490f40-09e2-4c8d-a447-67078ec413eb	ad2a1179-b01c-4f85-b150-dcd79b73ad9f	link - Electromagnetic	Every 10 Crit Hits from War Machine triggers EM Coil	1	Premium	0	\N	f
48f3fba9-554b-4c22-9041-12a076457aef	39490f40-09e2-4c8d-a447-67078ec413eb	\N	\N	After electromagnetic diffusion, it retracts, dealing secondary DMG	1	Core	2	\N	f
cbfd6cd6-46c2-48e7-af8e-ec481bc8adce	39490f40-09e2-4c8d-a447-67078ec413eb	\N	Trigger Lightning	100% chance to trigger lightning upon hitting an enemy	3	Premium	3	\N	f
5c745d47-4db4-4853-96e2-c67bd0d9bd24	39490f40-09e2-4c8d-a447-67078ec413eb	cbfd6cd6-46c2-48e7-af8e-ec481bc8adce	Lightning DMG Boost	Lightning DMG +100%	3	Premium	0	\N	f
c25fcc1c-69d0-4605-9896-4facacbf0992	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Projectile Boost	Projectile +1	1	Normal	0	\N	f
373e0cfc-2380-4236-907a-512a35010560	2765bc1c-aaa7-4079-b7c4-563daf57de63	c25fcc1c-69d0-4605-9896-4facacbf0992	Projectile Boost	Projectile +1	1	Normal	0	\N	f
df4f6561-bf9b-4e88-8839-8ef4a79d7f11	2765bc1c-aaa7-4079-b7c4-563daf57de63	373e0cfc-2380-4236-907a-512a35010560	Projectile Boost	Projectile +2	1	Premium	0	\N	f
41b04fc5-26b1-49f0-8c10-dc06b5dee385	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	\N	CD Speed +100%, DMG +50%	1	Core	1	\N	f
63b4c412-6e80-476e-a0f0-14f0f7aed713	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Blast Spreadshot	Every 3 shots, fires 3 extra small shells	1	Premium	2	\N	f
52dbefd1-b4f7-495f-889c-c99036528e6f	2765bc1c-aaa7-4079-b7c4-563daf57de63	63b4c412-6e80-476e-a0f0-14f0f7aed713	DMG Boost	Small shell DMG +50%	1	Normal	0	\N	f
e437fb52-da2d-46da-893a-ea7c5aaf757c	2765bc1c-aaa7-4079-b7c4-563daf57de63	63b4c412-6e80-476e-a0f0-14f0f7aed713	Extra Explosions	Small shells explode 1 extra time after growing	1	Normal	1	\N	f
581349d3-7302-49f6-9a0f-0d97761f474c	2765bc1c-aaa7-4079-b7c4-563daf57de63	63b4c412-6e80-476e-a0f0-14f0f7aed713	Count Boost	Small shell quantity +100%	1	Premium	2	\N	f
2c544fd6-7d32-4b8f-b941-12b75d5f3169	2765bc1c-aaa7-4079-b7c4-563daf57de63	63b4c412-6e80-476e-a0f0-14f0f7aed713	\N	Small shells generate 2 orbiting fireballs upon growing	1	Core	3	\N	f
0bd19646-c0c7-4cf6-9c13-1c8f777cd7d1	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Split Shells	50% chance to produce 2 small shells after growing	3	Normal	3	\N	f
4417adba-9c7f-45ce-87a4-c2f02d6c5db9	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	35a7b79d-8e19-4dd1-80b9-67440290e64d	Duration	Duration +60%	5	Normal	0	\N	f
b42ee376-b604-43ec-99d3-d0966a469cf0	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	CD Reduction	CD Speed +50%	5	Premium	8	\N	f
742c1bca-8795-4550-b005-d17425444e77	6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	DMG Boost	DMG +50%	1	Normal	9	\N	t
625e4c2e-18fd-4cac-b31c-3fc66e4d0a71	2eecd419-48f2-4016-bbb8-89ce167501aa	a0815d61-b2e9-4d55-9546-2a7d3e317473	Light Trail Freeze	Light Trail inflicts freeze effect	3	Normal	0	\N	f
ee3edac9-6f44-48d4-9307-03780df45e87	2eecd419-48f2-4016-bbb8-89ce167501aa	a0815d61-b2e9-4d55-9546-2a7d3e317473	Light Trail DMG Boost	Light Trail DMG +100%	3	Premium	1	\N	f
cc016764-fe82-4c67-b09a-03d320c79788	2eecd419-48f2-4016-bbb8-89ce167501aa	a0815d61-b2e9-4d55-9546-2a7d3e317473	Fragile Light Trail	Apply 30% vulnerability to enemies passing through Light Trails	3	Premium	2	\N	f
87561549-4fa5-4e22-bdcf-6729a1077d40	2eecd419-48f2-4016-bbb8-89ce167501aa	\N	DMG Boost	DMG +50%	1	Normal	7	\N	t
5d68cdb7-91ab-408c-8cfd-d2c73831a8ee	5496bedd-6f37-4247-9325-f1cfb7b63cd8	80142d4f-72d7-453f-96e3-c59ba6974ca0	DMG Boost	DMG to ignited enemies +100%	5	Premium	1	\N	f
a6ced9d9-6766-4da2-9bb0-2f561fc806a0	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	DMG Boost	DMG +60%	1	Normal	6	\N	t
d8372d5f-c952-46f1-90ff-03c6b035d3d3	cea694e3-24c4-42a6-b656-797411c3db5f	\N	Increased Quantity	Lightning Shield +1.	1	Normal	0	\N	f
4d15f047-8e7b-49c3-9296-06aeba4c5fa8	cea694e3-24c4-42a6-b656-797411c3db5f	d8372d5f-c952-46f1-90ff-03c6b035d3d3	Increased Quantity	Lightning Shield +1.	1	Normal	0	\N	f
73e922d0-4100-42bd-add1-1e35c5568120	cea694e3-24c4-42a6-b656-797411c3db5f	4d15f047-8e7b-49c3-9296-06aeba4c5fa8	Increased Quantity	Lightning Shield +2.	1	Premium	0	\N	f
7c39eb5c-706c-42bf-bd9b-34369b6fe678	cea694e3-24c4-42a6-b656-797411c3db5f	\N	\N	Lightning Shield Rotation Speed +30%, Cooldown Speed +100%.	1	Core	1	\N	f
1bd3cac3-75be-41b2-9e66-616e5ad185d1	cea694e3-24c4-42a6-b656-797411c3db5f	\N	\N	Evolution to Anode Thunder, Explosion DMG +100%, Range +50%.	1	Core	2	\N	f
56bfce55-9235-457e-8bf1-256652eb506c	cea694e3-24c4-42a6-b656-797411c3db5f	\N	Lightning Ray	Shield emits Lightning Ray upon appearing.	1	Premium	3	\N	f
061d69ec-bc33-4706-8471-61309d86e7bb	cea694e3-24c4-42a6-b656-797411c3db5f	56bfce55-9235-457e-8bf1-256652eb506c	Ray DMG Boost	Ray DMG +50%.	1	Normal	0	\N	f
3fd2c117-0088-4800-ab34-4611ec956007	2765bc1c-aaa7-4079-b7c4-563daf57de63	0bd19646-c0c7-4cf6-9c13-1c8f777cd7d1	Split Shells	50% chance to produce 3 small shells after growing	3	Normal	0	\N	f
818aac79-b0e4-4fdf-b57c-75fedfad6d2f	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Fire Residue	Leaves 2 small fires when shell disappears	3	Premium	4	\N	f
b4aa2ed8-9e81-4bf3-a323-28728399581e	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Orbiting Shells	Generate 2 orbiting fireballs when growing	3	Premium	5	\N	f
878a7f47-fbc2-4c4a-af06-6df00b279a8e	cea694e3-24c4-42a6-b656-797411c3db5f	56bfce55-9235-457e-8bf1-256652eb506c	Trigger Lightning	Ray has 50% chance to trigger Lightning upon hitting enemies.	1	Premium	1	\N	f
65dcafa8-4731-4ff0-a173-420e6ad9a6a4	cea694e3-24c4-42a6-b656-797411c3db5f	\N	Lightning Superconductor	Lightning Shield Crit Rate +50%.	3	Premium	4	\N	f
76ef62dd-8f16-4f5c-964c-061dab738a2d	cea694e3-24c4-42a6-b656-797411c3db5f	65dcafa8-4731-4ff0-a173-420e6ad9a6a4	Superconductor Amplification	Lightning Shield Crit DMG +100%.	3	Normal	0	\N	f
885eefb0-a3a8-4a2f-b958-5b46cfd45908	cea694e3-24c4-42a6-b656-797411c3db5f	65dcafa8-4731-4ff0-a173-420e6ad9a6a4	Lightning Ray	Crit Hit triggers Lightning Ray.	3	Premium	1	\N	f
a3265b3b-5cff-40d7-bd67-592562dac5a6	cea694e3-24c4-42a6-b656-797411c3db5f	\N	Lightning Speed Boost	Mech Movement Speed +50% when Shield appears.	3	Normal	5	\N	f
d42aff10-a8fe-4fd9-9bad-d6d1bf7e21b3	cea694e3-24c4-42a6-b656-797411c3db5f	a3265b3b-5cff-40d7-bd67-592562dac5a6	Lightning DMG Boost	Mech DMG +100% when Shield is activated.	3	Normal	0	\N	f
f68f7ea8-d976-4fde-a0c1-06b95d6938da	cea694e3-24c4-42a6-b656-797411c3db5f	a3265b3b-5cff-40d7-bd67-592562dac5a6	Lightning Quick Attack	Mech Fire Rate +150% when Shield is activated.	3	Premium	1	\N	f
092886d6-db03-452f-ad81-cfa51f7073e7	cea694e3-24c4-42a6-b656-797411c3db5f	\N	DMG Boost	DMG +60%	1	Normal	6	\N	t
645f9f84-0409-44ee-9e99-9daf9baf07a5	10383428-e582-446d-80ad-b934c311acda	\N	Range Boost	Explosion Range +75%	1	Normal	0	\N	f
c2b1fb99-afbb-4722-a9ef-7acfa74a26f6	10383428-e582-446d-80ad-b934c311acda	645f9f84-0409-44ee-9e99-9daf9baf07a5	Range Boost	Explosion Range +75%	1	Normal	0	\N	f
1cf7bb57-458a-4df3-83bd-d31f4f71ed27	10383428-e582-446d-80ad-b934c311acda	c2b1fb99-afbb-4722-a9ef-7acfa74a26f6	Range Boost	Explosion Range +150%	1	Premium	0	\N	f
e46bfa57-47bd-49a8-8e74-b7c1dcd2967e	10383428-e582-446d-80ad-b934c311acda	\N	Black Hole	Explosion creates a black hole that pulls in monsters	1	Premium	1	\N	f
b165e100-5c58-494d-abfe-b3dbe568cc2c	10383428-e582-446d-80ad-b934c311acda	e46bfa57-47bd-49a8-8e74-b7c1dcd2967e	Black Hole DMG Boost	Black Hole DMG +100%	1	Premium	0	\N	f
9026a223-b985-4c6c-8c06-bd639fb69885	10383428-e582-446d-80ad-b934c311acda	e46bfa57-47bd-49a8-8e74-b7c1dcd2967e	Dark Transformation	Black Hole creates a Small Meteor Cannon upon killing a monster	1	Premium	1	\N	f
2c75f859-5693-4f5c-bb70-9de68485feb4	10383428-e582-446d-80ad-b934c311acda	e46bfa57-47bd-49a8-8e74-b7c1dcd2967e	Black Hole Boost	Black Hole Gravity +50%, Black Hole DMG frequency +50%	1	Normal	2	\N	f
274ffdf5-1352-4e8e-a02d-861905e5cb7e	10383428-e582-446d-80ad-b934c311acda	e46bfa57-47bd-49a8-8e74-b7c1dcd2967e	\N	Black Hole range doubled. Generates one explosion after disappearing	1	Core	3	\N	f
9bb76a51-2ff4-4f84-aed3-333cbf500527	10383428-e582-446d-80ad-b934c311acda	\N	\N	25% chance to duplicate 3 Meteor Cannons upon hitting enemies	1	Core	2	\N	f
7121c28e-1a89-43c8-88e6-af237f888739	10383428-e582-446d-80ad-b934c311acda	\N	Bounce Boost	Bounce +1, DMG +20%	3	Normal	3	\N	f
f07e0798-e036-4705-b772-105ba141efc1	10383428-e582-446d-80ad-b934c311acda	7121c28e-1a89-43c8-88e6-af237f888739	Bounce Boost	Bounce +1, DMG +20%	3	Normal	0	\N	f
19565a7c-411a-46fa-b92f-f2949b80ddce	10383428-e582-446d-80ad-b934c311acda	f07e0798-e036-4705-b772-105ba141efc1	Bounce DMG Boost	Each Bounce DMG +60% (up to 180%)	3	Premium	0	\N	f
c43129cf-4652-4bd9-8ded-5352fc01014b	10383428-e582-446d-80ad-b934c311acda	\N	Starlight Bullet	Splits into four Starlight Projectiles upon hit	5	Premium	4	\N	f
23cc3e5d-50c0-40aa-9512-03ee76b86478	10383428-e582-446d-80ad-b934c311acda	c43129cf-4652-4bd9-8ded-5352fc01014b	DMG Boost	Starlight Projectiles DMG +50%	5	Normal	0	\N	f
cbd7d08a-cdbb-49f7-8a19-b50a754609bd	10383428-e582-446d-80ad-b934c311acda	c43129cf-4652-4bd9-8ded-5352fc01014b	Range Boost	Starlight Projectiles size +50%	5	Normal	1	\N	f
9bb3c6f7-2172-4114-b1eb-9a146d1aa316	10383428-e582-446d-80ad-b934c311acda	\N	CD Acceleration	CD Speed +25%, DMG +20%	3	Normal	5	\N	f
a5b46eb7-8a64-45e2-adcc-430eb3b183b5	10383428-e582-446d-80ad-b934c311acda	\N	DMG Boost	DMG +60%	1	Normal	6	\N	t
83042110-9025-446e-9b77-e40107473eab	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Projectile Boost	Missile count +4	1	Normal	0	\N	f
7367055d-7a2d-4bbf-b199-ff4df145a7b3	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	83042110-9025-446e-9b77-e40107473eab	Projectile Boost	Missile count +4	1	Normal	0	\N	f
39f009fb-02fe-41f8-9a1e-d15c914939a6	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	7367055d-7a2d-4bbf-b199-ff4df145a7b3	Projectile Boost	Missile count +8	1	Premium	0	\N	f
e9848040-423b-42e9-b88b-1e05705a784c	deaf8dcf-ced7-405b-8ccd-61c443673c93	a7ee5e09-b61e-4c1e-958c-6fdcb22e3c0c	Enhanced Continuous Fire	Continuous Fire +2. DMG +15% per hit on the same target, stacks up to 150%.	1	Premium	0	\N	f
e0889cb2-1d04-4965-b0b6-b20f07841b6e	deaf8dcf-ced7-405b-8ccd-61c443673c93	043f3121-68b8-42f4-b2d7-39a72eb8802c	\N	Continuous Fire x2.	1	Core	1	\N	f
5a1c93b4-d1f0-40f6-b77b-235855e3b283	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Support Missile	Fires 1 extra small missile at nearby enemies with each missile launch	1	Premium	1	\N	f
d889752c-d06d-4f01-9f5f-716e45ba6b6e	deaf8dcf-ced7-405b-8ccd-61c443673c93	5a1c93b4-d1f0-40f6-b77b-235855e3b283	Increased Support	Small Missile +1	1	Premium	0	\N	f
64289550-f0ff-44bb-83d0-cfdf473cfa94	deaf8dcf-ced7-405b-8ccd-61c443673c93	5a1c93b4-d1f0-40f6-b77b-235855e3b283	Freeze Support	Small Missiles have a 50% chance to freeze enemies	1	Normal	1	\N	f
03877ffe-ce60-4e62-b759-42347d7e1539	deaf8dcf-ced7-405b-8ccd-61c443673c93	5a1c93b4-d1f0-40f6-b77b-235855e3b283	DMG Boost	Small Missile DMG +50%	1	Normal	2	\N	f
869fd3e1-d597-43e1-a780-a9449d787fec	deaf8dcf-ced7-405b-8ccd-61c443673c93	5a1c93b4-d1f0-40f6-b77b-235855e3b283	\N	Small Missiles become larger. Explosion Range +50%, Count +100%	1	Core	3	\N	f
524bc500-7211-4f43-825e-418df72f15cf	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Freeze Missile	50% chance to freeze on hit	3	Normal	2	\N	f
b8078921-62fd-4419-bccc-6e3aad98ae0e	deaf8dcf-ced7-405b-8ccd-61c443673c93	524bc500-7211-4f43-825e-418df72f15cf	CD Growth	For every 10 freezes, CD Speed +5% (max 150%)	3	Premium	0	\N	f
7320246b-664a-448a-b315-ab80075e5d39	deaf8dcf-ced7-405b-8ccd-61c443673c93	524bc500-7211-4f43-825e-418df72f15cf	Freeze Special Attack	DMG to frozen enemies +100%	3	Premium	1	\N	f
abe22769-56bf-4663-8308-e9951763ae50	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Shark Trap	Killing an enemy has a 30% chance to leave a Shark Trap that attacks passing enemies.	3	Premium	3	\N	f
53d3cb56-a154-4d8c-9347-d2dddadaa5cd	deaf8dcf-ced7-405b-8ccd-61c443673c93	abe22769-56bf-4663-8308-e9951763ae50	DMG Boost	Shark Trap DMG +100%	3	Premium	0	\N	f
75417294-381e-48ce-b5ce-9f381703e9a1	deaf8dcf-ced7-405b-8ccd-61c443673c93	abe22769-56bf-4663-8308-e9951763ae50	Ice Trap	Shark Trap applies Freeze	3	Normal	1	\N	f
23907115-3cb9-4fbd-9464-db815338fbc8	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Ice Shark Missile	Every 6 attacks, fire an extra Shark Bomb that explodes to create a large frost area on the ground	3	Premium	4	\N	f
3205f98f-8d3b-4666-a50d-36f41e57d263	deaf8dcf-ced7-405b-8ccd-61c443673c93	23907115-3cb9-4fbd-9464-db815338fbc8	DMG Boost	Shark Bomb DMG +50%	3	Normal	0	\N	f
9dc48981-db51-459b-a732-3ef511288fa4	deaf8dcf-ced7-405b-8ccd-61c443673c93	23907115-3cb9-4fbd-9464-db815338fbc8	Frost Explosion	Shark Bomb explosion is guaranteed to Freeze.	3	Normal	1	\N	f
ac804d59-a239-431b-832b-acd319093440	deaf8dcf-ced7-405b-8ccd-61c443673c93	23907115-3cb9-4fbd-9464-db815338fbc8	Range Boost	Frost Ground Range +50%	3	Normal	2	\N	f
f3c7f5f9-cfe0-479d-a49f-33ed3bf51b33	deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	DMG Boost	DMG +60%	1	Normal	5	\N	t
d3e721c5-c039-460f-9c9b-31cafad3352a	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Turret Expansion	Turret +1	1	Normal	0	\N	f
c2c7cfea-60fe-4d44-869e-1631536a8d87	a5409e64-78ee-46dc-89eb-d956e1c7e532	d3e721c5-c039-460f-9c9b-31cafad3352a	Turret Expansion	Turret +1	1	Normal	0	\N	f
0cafb0c1-80e3-4785-a288-d70611af5408	a5409e64-78ee-46dc-89eb-d956e1c7e532	c2c7cfea-60fe-4d44-869e-1631536a8d87	Turret Expansion	Turret +2	1	Premium	0	\N	f
f7a6966b-49f2-4582-91b6-0be9faec6665	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Energy Detonation	Lasers continuously generate explosions on main target	1	Premium	1	\N	f
db3c59c8-c6d9-4f76-939a-f686e3bf5d89	a5409e64-78ee-46dc-89eb-d956e1c7e532	f7a6966b-49f2-4582-91b6-0be9faec6665	Explosive Boost	Explosion Range +50%	1	Normal	0	\N	f
24aa75c4-5871-438f-a708-5384401676a9	a5409e64-78ee-46dc-89eb-d956e1c7e532	f7a6966b-49f2-4582-91b6-0be9faec6665	DMG Boost	Explosion DMG +50%	1	Normal	1	\N	f
3f7608b4-31d2-4522-aaf1-caa5ba637275	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	\N	Evolves into Extreme Cold Laser, DMG +100%, with 30% chance to Freeze	1	Core	2	\N	f
d8920a75-66ba-425f-b91e-441e822a53d7	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	\N	Evolves to Shock Turret: Releases continuous shockwaves	1	Core	3	\N	f
9a47ca52-e4f0-4c96-9cea-68473da9d582	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Laser Chain	Connects Laser Chain between adjacent Turrets	3	Premium	4	\N	f
b33f3841-6278-4a22-9d5c-486f8836e7e1	a5409e64-78ee-46dc-89eb-d956e1c7e532	9a47ca52-e4f0-4c96-9cea-68473da9d582	DMG Boost	Laser Chain DMG +50%	3	Normal	0	\N	f
788cd683-e707-4c3b-ae03-ca8bbe4d7aff	a5409e64-78ee-46dc-89eb-d956e1c7e532	9a47ca52-e4f0-4c96-9cea-68473da9d582	Frost Chain	Laser Chain has a 50% chance to cause Freeze	3	Premium	1	\N	f
8d2e4b56-db1d-4311-b01e-dd3e4e39b2a2	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Duration	Laser Duration +50%	3	Normal	5	\N	f
496de145-4d9e-40b3-8dd5-5cb7ab068e00	a5409e64-78ee-46dc-89eb-d956e1c7e532	8d2e4b56-db1d-4311-b01e-dd3e4e39b2a2	Duration	Laser Duration +50%. Main Target DMG +50%	3	Premium	0	\N	f
cb11af92-956e-42e7-8b84-f5771aff5ce1	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Advanced Targeting	Targeting Range +50%	5	Normal	6	\N	f
2bddcff7-0b29-498c-bbb6-0423202c12c5	a5409e64-78ee-46dc-89eb-d956e1c7e532	cb11af92-956e-42e7-8b84-f5771aff5ce1	Advanced Targeting	Targeting Range +50%. DMG Frequency +50%	5	Premium	0	\N	f
8e7b7ec6-a556-4c71-b94a-c17e2c7bd03a	a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	DMG Boost	DMG +50%	1	Normal	7	\N	t
0e30db56-36f1-4cae-8a65-6773c36d4335	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	Projectile Boost	Continuous Fire +1	1	Normal	0	\N	f
7c859091-d766-44dc-a791-0f5214a5ef6e	5496bedd-6f37-4247-9325-f1cfb7b63cd8	0e30db56-36f1-4cae-8a65-6773c36d4335	Projectile Boost	Continuous Fire +1	1	Normal	0	\N	f
25afd6ce-35d2-4d31-b02c-53601c4d82bc	5496bedd-6f37-4247-9325-f1cfb7b63cd8	7c859091-d766-44dc-a791-0f5214a5ef6e	Projectile Boost	Continuous Fire +2	1	Premium	0	\N	f
f3c32fbb-4b7f-4aef-aa3a-cb5276f9aadf	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	\N	Lava Pool intermittently splashes Fireballs	1	Core	1	\N	f
5129de39-205f-4a1e-b65e-6bae995c49c8	2765bc1c-aaa7-4079-b7c4-563daf57de63	b4aa2ed8-9e81-4bf3-a323-28728399581e	DMG Boost	Orbiting fireball DMG +50%	3	Normal	0	\N	f
03318f50-8fc3-4a24-91be-84c71f6f70c7	2765bc1c-aaa7-4079-b7c4-563daf57de63	b4aa2ed8-9e81-4bf3-a323-28728399581e	Count Boost	Orbiting fireball quantity +100%	3	Premium	1	\N	f
cb699311-0538-4834-80e4-1465e725e4f4	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Stun Shells	30% chance to stun enemies when growing	5	Normal	6	\N	f
1b695868-af64-4c45-9761-28e2b968bc8e	2765bc1c-aaa7-4079-b7c4-563daf57de63	cb699311-0538-4834-80e4-1465e725e4f4	Stun Shells	Stun chance +45%	5	Normal	0	\N	f
f0daa770-8407-4bbe-b5af-dbe130e7b1b8	2765bc1c-aaa7-4079-b7c4-563daf57de63	cb699311-0538-4834-80e4-1465e725e4f4	Stun DMG Bonus	DMG to stunned enemies +150%	5	Premium	1	\N	f
119a3265-9a4c-4184-b6b6-4a82d647105d	2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	DMG Boost	DMG +60%	1	Normal	7	\N	t
5d34694f-ab92-4460-879d-53535af47672	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	Increased Quantity	Demon Bot +1.	1	Normal	0	\N	f
bcfed9ae-3732-4bb0-8c20-736089559698	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	5d34694f-ab92-4460-879d-53535af47672	Increased Quantity	Demon Bot +1.	1	Normal	0	\N	f
1cc9b9eb-de1e-4a37-bbd0-13139d54cd49	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	bcfed9ae-3732-4bb0-8c20-736089559698	Increased Quantity	Demon Bot +2.	1	Premium	0	\N	f
a0520442-5501-45eb-90c7-5ed40e23900d	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	\N	Demon Cannon fires twice consecutively.	1	Core	1	\N	f
f5f927d0-544d-4d5c-a800-e79804d8a45e	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	\N	Chaos Horde: Demon Bot bounce count doubled, bounces after the 2nd move in a random direction.	1	Core	2	\N	f
e2267556-6eb2-453f-8123-da152b576b69	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	Demon Trident	Fires Demon Tridents with each bounce.	1	Premium	3	\N	f
88623477-e741-463c-9172-9bbb964c79fb	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	e2267556-6eb2-453f-8123-da152b576b69	Trident Boost	Demon Trident Size +50%.	1	Normal	0	\N	f
f6652771-fa25-4ffb-b530-258c480c8300	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	e2267556-6eb2-453f-8123-da152b576b69	Increased Quantity	Demon Trident +100%.	1	Normal	1	\N	f
d1871e42-688e-481c-96a6-224bb701785c	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	e2267556-6eb2-453f-8123-da152b576b69	Penetration Boost	Demon Trident Penetration +2.	1	Normal	2	\N	f
367e0ab5-ecaa-4552-a435-6af3df0a0db1	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	Range Boost	Fire Rings Range +50%.	3	Normal	4	\N	f
18cf1a69-e42e-47aa-a962-4f406bc7fe85	4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	367e0ab5-ecaa-4552-a435-6af3df0a0db1	Double Inferno	Fire Rings spread +1 additional time (2nd spread range +100%).	3	Premium	0	\N	f
40b1ca76-fa4a-4f1e-9c74-47b600c1a115	5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	More Splashes	Explosive Flame splashes 3 Fireballs	1	Premium	2	\N	f
746e0c2a-5367-41c5-b583-82e8d2828c8a	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Projectile Boost	Aircraft Projectile +1	1	Normal	0	\N	f
499ab849-f3e5-4e75-9e23-3fc5ddeb6a56	d498931e-9321-4f1a-a9e2-7685fcd64a69	746e0c2a-5367-41c5-b583-82e8d2828c8a	Projectile Boost	Aircraft Projectile +1	1	Normal	0	\N	f
e155d612-0b7a-427d-b023-5de819aff00b	d498931e-9321-4f1a-a9e2-7685fcd64a69	499ab849-f3e5-4e75-9e23-3fc5ddeb6a56	Projectile Boost	Aircraft Projectile +2	1	Premium	0	\N	f
79114b0d-abf1-47c1-8a70-9922767f1bc0	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	\N	Flight path of small Aircraft changed, Fire Rate +100%	1	Core	1	\N	f
154af1c5-3439-470b-8a4d-da2303918f41	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	\N	Aircraft Count +100%	1	Core	2	\N	f
672409fe-04c4-40dc-be52-43babe082ed2	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Bounce Off	Small Aircraft Movement Speed +50%, bounces off screen edges.	1	Premium	3	\N	f
c2c880a2-8f0a-4848-905b-d46462ff9f6e	d498931e-9321-4f1a-a9e2-7685fcd64a69	672409fe-04c4-40dc-be52-43babe082ed2	DMG Boost	Return DMG +50%	1	Normal	0	\N	f
d06b4406-4a03-4a51-a7a0-01d9dfce6298	d498931e-9321-4f1a-a9e2-7685fcd64a69	672409fe-04c4-40dc-be52-43babe082ed2	Fire Rate Boost	Fire Rate +100% on bounces off	1	Premium	1	\N	f
ea447ca9-d646-457c-80fa-abf92df25e58	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Prowl Mode	Every 10 sec, launches 3 small Aircraft that prowl the area	3	Premium	4	\N	f
084498e3-0eb4-4000-ba80-c578015ac6f9	d498931e-9321-4f1a-a9e2-7685fcd64a69	ea447ca9-d646-457c-80fa-abf92df25e58	Self-Destruct	Explodes after prowling	3	Normal	0	\N	f
ec197ee8-1fa2-4f79-8663-7bc4a9b28949	d498931e-9321-4f1a-a9e2-7685fcd64a69	ea447ca9-d646-457c-80fa-abf92df25e58	DMG Boost	Prowl DMG +50%	3	Normal	1	\N	f
4e97b2be-81e5-47d2-8b0f-38cc38c071ed	d498931e-9321-4f1a-a9e2-7685fcd64a69	ea447ca9-d646-457c-80fa-abf92df25e58	Continuous Flight	Prowl Time +50%	3	Normal	2	\N	f
66cff54b-b369-40eb-be8b-918d78e91548	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Spreadshot Barrage	Aircraft fires spreadshots all around	3	Premium	5	\N	f
c6f65508-1c36-49ca-8ef1-91a3a2c03538	d498931e-9321-4f1a-a9e2-7685fcd64a69	66cff54b-b369-40eb-be8b-918d78e91548	High-Frequency Barrage	Spreadshots Density +100%	3	Premium	0	\N	f
4dd50e0c-3efe-446a-ae8d-fae28a118520	d498931e-9321-4f1a-a9e2-7685fcd64a69	66cff54b-b369-40eb-be8b-918d78e91548	DMG Boost	Spreadshots DMG +50%	3	Normal	1	\N	f
5eb91d23-d9c8-4b5b-a02d-d455f495b4a3	d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Kill Split	50% chance to generate split bullets on kill.	5	Premium	6	\N	f
19be51ca-35e2-4f09-8a63-2be31c91ea1a	d498931e-9321-4f1a-a9e2-7685fcd64a69	5eb91d23-d9c8-4b5b-a02d-d455f495b4a3	Split Boost	Split Bullet +2	5	Normal	0	\N	f
bbf2cab6-165a-4fd2-b6ee-910d54bbfc9e	d498931e-9321-4f1a-a9e2-7685fcd64a69	5eb91d23-d9c8-4b5b-a02d-d455f495b4a3	Probability Increased	Split Bullet chance increased	5	Normal	1	\N	f
d91a5686-d129-432b-99ed-584736d02287	c318dde8-fc44-4702-875c-19b038ba80c2	\N	Increased Quantity	Gourd +1	1	Normal	0	\N	f
e09d4b12-ae2d-4af7-a06a-58e6d55a0aae	c318dde8-fc44-4702-875c-19b038ba80c2	d91a5686-d129-432b-99ed-584736d02287	Increased Quantity	Gourd +1	1	Normal	0	\N	f
71f838c0-3e16-4f33-8cc9-a7c45bbf93e8	c318dde8-fc44-4702-875c-19b038ba80c2	e09d4b12-ae2d-4af7-a06a-58e6d55a0aae	Increased Quantity	Gourd +2	1	Premium	0	\N	f
2f731af7-4e76-4d99-b0d9-b737f00a92af	c318dde8-fc44-4702-875c-19b038ba80c2	\N	\N	Gourd Fire Spray Range +50%, DMG +100%	1	Core	1	\N	f
7a16c9d0-cef8-4df8-939a-bdd517af67e4	c318dde8-fc44-4702-875c-19b038ba80c2	\N	\N	CD Speed +30%, executes monsters with HP ≤20%.	1	Core	2	\N	f
a18e3227-025c-46ac-a159-782acde35a8f	c318dde8-fc44-4702-875c-19b038ba80c2	\N	Fire Residue	100% chance to leave Fire Residue on the ground after the Gourd disappears.	1	Premium	3	\N	f
a6c6bb40-a261-4bd2-bf90-81e4f4f9e6fb	c318dde8-fc44-4702-875c-19b038ba80c2	a18e3227-025c-46ac-a159-782acde35a8f	Fire DMG Boost	Fire Residue DMG +50% every 1s (max 200%)	1	Premium	0	\N	f
828c4151-349e-4013-87ae-f477a02848d7	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Explosive Burning	Explosion leaves behind burning residue	1	Premium	1	\N	f
b9e3fbee-591e-47cb-a67c-6b20e856f47b	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	828c4151-349e-4013-87ae-f477a02848d7	DMG Boost	Burning DMG +50%	1	Normal	0	\N	f
b5e0e0e1-0011-416b-854b-3df600060649	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	828c4151-349e-4013-87ae-f477a02848d7	Range Boost	Burning Range +100%	1	Premium	1	\N	f
39b155e9-01ab-4231-b3e4-7fd7f4992d32	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	828c4151-349e-4013-87ae-f477a02848d7	Burning Slow Down	Burning area inflicts slow effect	3	Normal	2	\N	f
493802cf-8581-46af-b9fe-649411788d55	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	\N	Evolve to super missile. DMG +100%. Range +100%	1	Core	2	\N	f
9f679043-63ce-4e1d-8031-b8f94dda2d5e	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	link - Tank	Doomsday Tank has a 10% chance to trigger missile launcher on attack	3	Premium	3	\N	f
ac107947-3920-496a-9701-b1e22a1e844f	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Explosion DMG Boost	Explosive DMG +50%	3	Normal	4	\N	f
9e9635ac-7383-4a39-b972-05d309a8d04d	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	ac107947-3920-496a-9701-b1e22a1e844f	Explosion DMG Boost	Explosive DMG +100%	3	Premium	0	\N	f
9c8c5e0a-2aa2-4a1a-a31b-ac99adc6eca8	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Explosion Stun	30% chance to stun enemies upon explosion	5	Normal	5	\N	f
8596c79c-77cd-4596-9eb8-90ffbd8a1bc0	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	9c8c5e0a-2aa2-4a1a-a31b-ac99adc6eca8	Stun Boost	Double Stun chance	5	Normal	0	\N	f
4dc0dd96-1219-404f-8374-7a01bba74346	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Fierce Battle	When an Elite/BOSS appears, DMG +150% for 30 secs	5	Premium	6	\N	f
8e1faabe-a87a-4d63-8a3d-f312ef8564f2	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	4dc0dd96-1219-404f-8374-7a01bba74346	Emergency Cooldown	When an Elite/BOSS appears, CD speed +100% for 30 secs	5	Premium	0	\N	f
aa62970a-799e-4714-a2d5-725e4c402bf8	cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	DMG Boost	DMG +50%	1	Normal	7	\N	t
8c1ca7df-c7fa-490c-a255-b5389b65bc58	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
9ef36092-7144-42eb-8afe-3e90e6d168ba	ee348817-74d2-4f14-83b5-306964cb5da9	8c1ca7df-c7fa-490c-a255-b5389b65bc58	Continuous Fire	Continuous Fire +1	1	Normal	0	\N	f
ace5839a-60ae-4936-aec7-eea2e49fb39c	ee348817-74d2-4f14-83b5-306964cb5da9	9ef36092-7144-42eb-8afe-3e90e6d168ba	Continuous Fire	Continuous Fire +2	1	Premium	0	\N	f
856804fd-8bc2-4c46-a8d1-1874bdf6dc04	ee348817-74d2-4f14-83b5-306964cb5da9	\N	\N	Super Grenade, greatly increases DMG and Range	1	Core	1	\N	f
11ab7f9c-bbc7-41de-ab82-cfdcd0a0f1ae	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Explosive Burning	Explosion leaves behind burning residue	1	Premium	2	\N	f
719fd21b-690d-4a4a-b175-7f3ef3a7c1f6	ee348817-74d2-4f14-83b5-306964cb5da9	11ab7f9c-bbc7-41de-ab82-cfdcd0a0f1ae	Ignition	Burning with ignition effect	1	Normal	0	\N	f
511d1c60-6629-43a3-99c4-4536ae86005f	ee348817-74d2-4f14-83b5-306964cb5da9	11ab7f9c-bbc7-41de-ab82-cfdcd0a0f1ae	Fire DMG Boost	Burning DMG +50%	1	Normal	1	\N	f
2eabbcaf-2eba-4d34-9116-0f0a12a3689d	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Range Boost	Explosion Range +50%. Burning Range +50%	3	Premium	3	\N	f
1e75891f-fbc5-4b68-a1c5-6324cc59c01d	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Range Boost	Explosion Range +50%	3	Normal	4	\N	f
62b19d10-d479-430d-a477-3dc912023b97	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Consecutive Projectiles	Grenade bounces twice and explodes	5	Premium	5	\N	f
f3a7dd64-c642-459e-8a88-b187716a97a8	ee348817-74d2-4f14-83b5-306964cb5da9	62b19d10-d479-430d-a477-3dc912023b97	\N	Grenade bounces and explodes three times after landing	5	Core	0	\N	f
0e8c0f35-496a-477d-9b4b-5417036ca647	ee348817-74d2-4f14-83b5-306964cb5da9	\N	Emergency Spread	When monsters on the field ≥50, fire 2 grenades	5	Premium	6	\N	f
7eb57bc7-b8cd-47a9-9cc9-80b84c112812	ee348817-74d2-4f14-83b5-306964cb5da9	0e8c0f35-496a-477d-9b4b-5417036ca647	Emergency	When monsters on the field ≥50, DMG +150%	5	Premium	0	\N	f
71bc5275-fb63-499c-adc2-a8e584087385	ee348817-74d2-4f14-83b5-306964cb5da9	\N	DNG Boost	DMG +50%	1	Normal	7	\N	t
d7e3a596-2562-4d99-a0e1-e261ff3609b2	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Increased Quantity	Speaker Count +1	1	Normal	0	\N	f
f5e6b57d-174a-41f1-b54a-b6545381c733	671895ba-5649-46ba-98cd-199f9d5710e6	d7e3a596-2562-4d99-a0e1-e261ff3609b2	Increased Quantity	Speaker Count +1	1	Normal	0	\N	f
54ec00f2-84de-4281-a70b-4373a96e7137	671895ba-5649-46ba-98cd-199f9d5710e6	f5e6b57d-174a-41f1-b54a-b6545381c733	Increased Quantity	Speaker Count +2	1	Premium	0	\N	f
e6da700e-60e3-4c9c-aac3-dd18b29a15ca	671895ba-5649-46ba-98cd-199f9d5710e6	\N	\N	Super Speaker, Movement SPD +100%, Duration +100%	1	Core	1	\N	f
448c8d5b-f9d5-4591-8b0b-2bb3c15c97d7	671895ba-5649-46ba-98cd-199f9d5710e6	\N	\N	Soundwave DMG +100%, lingers for 1s before disappearing	1	Core	2	\N	f
70987f09-9a42-4c38-bc3b-ca2ef6a03d19	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Booming Speaker	Summon a row of Booming Speakers that attack forward for every 3 Speaker summons	1	Premium	3	\N	f
8b2f7a96-8605-49ed-97c4-8530fd039868	671895ba-5649-46ba-98cd-199f9d5710e6	70987f09-9a42-4c38-bc3b-ca2ef6a03d19	DMG Boost	Booming Speaker DMG +50%	1	Normal	0	\N	f
4c76e356-a56f-46d0-8878-516d87a212bf	671895ba-5649-46ba-98cd-199f9d5710e6	70987f09-9a42-4c38-bc3b-ca2ef6a03d19	Continuous Boom	Booming Speaker Duration +50%	1	Normal	1	\N	f
722951bf-5b6f-4515-8fff-6a1a5c482f37	671895ba-5649-46ba-98cd-199f9d5710e6	70987f09-9a42-4c38-bc3b-ca2ef6a03d19	Increased Quantity	Booming Speaker Count +100%	1	Premium	2	\N	f
55cbbaf8-ff3a-4c75-8f31-af36314e06ca	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Bass	Bass Mode, Soundwave Range +50%	3	Normal	4	\N	f
a30de03e-485b-41cc-8ba6-d23a22e0744d	671895ba-5649-46ba-98cd-199f9d5710e6	55cbbaf8-ff3a-4c75-8f31-af36314e06ca	Bass Special Effect	If a Bass attack hits more than 8 enemies, next attack DMG +100%	3	Premium	0	\N	f
b223e2db-1424-4f2b-a832-336c4b527d4f	671895ba-5649-46ba-98cd-199f9d5710e6	55cbbaf8-ff3a-4c75-8f31-af36314e06ca	Amplified Soundwave	Soundwave Range +50%	3	Normal	1	\N	f
63973937-d5d0-4204-8241-c12a7e8e92e5	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Treble	Treble Mode, Speaker ATK SPD +50%	3	Normal	5	\N	f
cf29d856-6f1e-4c24-ad6f-c6d535a7c224	671895ba-5649-46ba-98cd-199f9d5710e6	63973937-d5d0-4204-8241-c12a7e8e92e5	Treble Special Effect	Treble attacks on the same monster gain 100% Extra DMG Boost	3	Premium	0	\N	f
bb5db116-aa26-41be-8219-be59e5627394	671895ba-5649-46ba-98cd-199f9d5710e6	63973937-d5d0-4204-8241-c12a7e8e92e5	High-Frequency Soundwave	Speaker ATK SPD +50%	3	Normal	1	\N	f
96b72785-4613-4b71-91a8-23d94c5646d0	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Voice of Destruction	Release Voice of Destruction when the Speaker disappears	3	Premium	6	\N	f
7275459f-cf4d-49e1-8f28-e503e345bbd9	671895ba-5649-46ba-98cd-199f9d5710e6	96b72785-4613-4b71-91a8-23d94c5646d0	Final Requiem	Final Voice hits inflict 30% Vulnerability for 5s	3	Normal	0	\N	f
17603595-fe81-4b29-bc93-8a82292c0377	671895ba-5649-46ba-98cd-199f9d5710e6	96b72785-4613-4b71-91a8-23d94c5646d0	Range Boost	Voice of Destruction Range +50%	3	Normal	1	\N	f
98251dc4-1111-470d-b0ce-1b29eb494f40	671895ba-5649-46ba-98cd-199f9d5710e6	\N	Siren's Call	Release Siren's Call to attract enemies when the Speaker appears	5	Premium	7	\N	f
5fe926d4-7660-4649-a426-91652f395e87	671895ba-5649-46ba-98cd-199f9d5710e6	98251dc4-1111-470d-b0ce-1b29eb494f40	Range Boost	Siren's Call Range +100%	5	Normal	0	\N	f
f5477759-fbdf-4d8e-bddc-3c550be6155c	671895ba-5649-46ba-98cd-199f9d5710e6	98251dc4-1111-470d-b0ce-1b29eb494f40	DMG Boost	Siren's Call DMG +50%	5	Normal	1	\N	f
dcb623eb-a1af-4b3c-82a4-5a4996506c19	671895ba-5649-46ba-98cd-199f9d5710e6	\N	DMG Boost	DMG +60%	1	Normal	8	\N	t
\.


--
-- Data for Name: skill_upgrades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill_upgrades (id, skill_id, parent_id, name, description, is_evolution, unlock_req) FROM stdin;
42d9b899-c7e4-4558-9dfe-1142dcddf6bc	d2edd801-319b-4947-bc6d-9cae2a01427f	\N	Thunder Slash I	Damage +15%.	f	\N
8312d5b0-3469-4af5-87e1-8daac51d13f8	d2edd801-319b-4947-bc6d-9cae2a01427f	42d9b899-c7e4-4558-9dfe-1142dcddf6bc	Chain Lightning	Arcs jump to 2 additional enemies.	f	2/8
7df08caf-893b-443b-b7b4-25027ba48b7a	d2edd801-319b-4947-bc6d-9cae2a01427f	42d9b899-c7e4-4558-9dfe-1142dcddf6bc	Wide Arc	Sweep angle +40°.	f	2/8
ff83a7f1-c7dd-46af-a328-8f2157b7fb86	d2edd801-319b-4947-bc6d-9cae2a01427f	8312d5b0-3469-4af5-87e1-8daac51d13f8	Storm Evolution	Evolve into Storm Slash: every 3rd hit calls a lightning strike.	t	3/8
d3e48aaa-74a5-43e2-b694-54afde710346	fd8e4504-dd83-4697-8478-ab10e0d9b018	\N	Shadow Step I	Cooldown -1s.	f	\N
dc0ab38b-1e80-4bc8-8711-7adcbffa7f1f	fd8e4504-dd83-4697-8478-ab10e0d9b018	d3e48aaa-74a5-43e2-b694-54afde710346	Afterimage	Leaves a decoy that taunts for 2s.	f	4/8
\.


--
-- Data for Name: skin_stars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skin_stars (id, skin_id, star, perk) FROM stdin;
3ae16286-c361-41d6-9bc7-3afabcbf7546	78346030-d093-4e51-8812-ea74a6662354	1	30% chance to paralyze enemies on hit.
da20f859-1e6b-4d9e-913f-9595b027219c	78346030-d093-4e51-8812-ea74a6662354	2	Initial DMG +25%
b93bec78-c39e-4007-8d0b-60d8f09e7ba6	78346030-d093-4e51-8812-ea74a6662354	3	30% chance to trigger a Thunder Burst when hitting a paralyzed enemy
2690f054-9b41-4651-8dc8-df28f0f4a5a0	78346030-d093-4e51-8812-ea74a6662354	4	Initial DMG +25%
10c2afb2-8131-4c43-b4ee-b6284baad805	78346030-d093-4e51-8812-ea74a6662354	5	In Optimus Tank, Fire Rate +50% and hitting paralyzed enemies guarantees a Thunder Burst
24c7ce9d-5b01-4c5e-a376-930124f22a0e	0e0c3617-5d82-4c03-b9fd-9d9f90391c11	1	Use Ghost Shadow Dart to attack, with a 20% chance of hitting the enemy and triggering an explosion
de333241-2179-42de-8d25-59384bc01f9e	0e0c3617-5d82-4c03-b9fd-9d9f90391c11	2	Initial DMG +25%
5935b487-2452-4934-ac97-94909a64547d	0e0c3617-5d82-4c03-b9fd-9d9f90391c11	3	Explosion range +25%
16602284-6cd9-4748-a308-07b7ea19f18a	0e0c3617-5d82-4c03-b9fd-9d9f90391c11	4	Initial DMG +25%
1be26a47-94b5-4b5b-a39e-b352176e52c7	0e0c3617-5d82-4c03-b9fd-9d9f90391c11	5	Explosion DMG +150%
\.


--
-- Data for Name: skins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skins (id, mech_id, name, description, image_url) FROM stdin;
0e0c3617-5d82-4c03-b9fd-9d9f90391c11	dd80f22d-8562-4920-99d0-f6f858347960	Oni Samurai	\N	/uploads/17cdcfd4-4883-4998-9a72-278573007aa8.jpg
78346030-d093-4e51-8812-ea74a6662354	d3e0d08d-0335-486d-aee6-cdb80ca05ec2	Mighty Lion King	\N	/uploads/ba444d4e-a20b-40b3-bb5e-06212d8aedf6.jpg
\.


--
-- Data for Name: traits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.traits (id, name, color) FROM stdin;
41caa475-8e40-4bfa-aacd-d5187a710689	Heavy Armor Type	\N
edc9cbf5-73b6-4322-a8f5-ce7bd9226535	Rapid Fire	\N
fe925319-8a6c-4724-8c39-a353afd74b72	Freeze	\N
f850be31-ff74-4ba4-8543-e32f92fed8b8	Balance	\N
4c0e3966-d8d5-4895-aa6d-8bcd14824983	Control Type	\N
b91916b6-e4a2-47eb-8df9-b3ff4808a46f	Energy	\N
1414b5ba-2315-41b5-a238-c2a3b93ef5d8	AoE	\N
5a0bc328-0473-44ff-aa35-26acc6254e0e	Explosive	\N
1e7a6270-2687-4584-b131-1eaea04a545c	Firepower Type	\N
752cdc21-b370-4f9d-ae0f-d26d9b680e36	Thunder	#5aa9ff
12a9eb00-dfcb-4e8d-a65d-aba0a7c5044e	Spreadshots	#ffb84d
9189143e-4766-4dc0-b9ab-a1c43680e852	Physical	#c0c0c0
f19d88d8-8c3e-463f-b96c-ccc726427e5b	Ultimate Mech	\N
d073f4c0-c5da-40d5-9803-5f4ebb93e9c2	Balanced	\N
\.


--
-- Data for Name: types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types (id, name, icon_url) FROM stdin;
39a4b1b1-68e5-4aac-9a31-57e55afcb409	Ice	/uploads/05163afa-4093-452a-8e64-a67de904349f.png
470e9b8f-fd3a-4ab8-b588-3e43e490445c	Physical	/uploads/cbd94a30-6fba-48b3-a807-dd8374987626.png
92c90c03-21d5-44f0-8be9-9f6548d3ab11	Thunder	/uploads/c6b77960-a1b3-4e14-a86f-b510b55c89e4.png
f6b13a07-6376-40fe-a29b-99c78f118ed5	Energy	/uploads/ffd09d85-d4da-4023-bb33-bb06d52cfc3b.png
86ab792d-d234-4702-a021-779e39aabe32	Explosive	/uploads/56c75792-8ac0-476f-8d97-ec66ed274a6e.png
94b3df23-fe2f-4155-9bd0-b3449544ddd3	Fire	/uploads/e5199992-0f9b-4539-93f6-2d6b9a55ed95.png
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, auth0_sub, nickname, server, created_at, name) FROM stdin;
df613662-82e0-4008-8edc-75d13860889a	google-oauth2|111512299807606933005	Banz	E109	2026-07-20 17:34:50.941	Banzai Fun
a822ed9a-6e18-4b0d-bae4-2a60279bc24e	google-oauth2|104678132010827720438	BanzaiFun	E109	2026-07-20 17:35:48.188	Roman Nikitenko
\.


--
-- Data for Name: weapon_skins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weapon_skins (id, weapon_id, name, bonuses, image_url) FROM stdin;
f0d4b957-4b11-4e11-8a25-41538c6f2e3a	dfb1c6de-9740-4406-b101-651fb6139b0a	Ghost Hand Launcher	{"Sa Ling has evolve into a ghost hand, capable of killing small monsters with a health < 10%, has half the effect on elites and bosses.","Initial DMG +25%","Critical hit rate +25%","Initial DMG +25%","Ghost Hand can kill small monsters with a health of < 25%, has half the effect on elites and bosses."}	/uploads/474d25be-319a-4a32-8a0d-1306c1af3ec4.webp
\.


--
-- Data for Name: weapon_upgrades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weapon_upgrades (id, weapon_id, parent_id, name, description, is_evolution, unlock_req) FROM stdin;
\.


--
-- Data for Name: weapons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weapons (id, mech_id, name, description, base_stats, type_id, tier, rank_up_preview, image_url, icon_url) FROM stdin;
dfb1c6de-9740-4406-b101-651fb6139b0a	dd80f22d-8562-4920-99d0-f6f858347960	Ninja Spikes Gun	Lay down spreading spikes on the ground, dealing DMG to passing enemies.	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	S	{"Initial DMG +50%","[Trigger Lightning] chance increased","Lightning Initial DMG +50%","DMG to Paralysed Enemies +100%","Initial [Trigger Lightning] effect","Critical Hit rate +50%","When using [Blade Shadow Warrior]. start with the [High-Density Spikes] effect"}	/uploads/248d859a-ca92-491e-a86c-1f09507ce805.webp	/uploads/8c6e9006-ef11-415c-ab25-280ed8a35675.png
ffdb479f-7e51-442d-aba8-73491021b5fb	\N	Firethrower	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	Standard	{}	/uploads/1c39b425-4f69-48d8-ade5-2f9d1e3cf231.jpg	/uploads/6d0eee9b-e0c8-4ef4-b22d-5f09a4415f1b.jpg
bbb0942b-f51d-4190-9689-17d2bc946ba9	\N	Frost Mech Cannon	\N	\N	39a4b1b1-68e5-4aac-9a31-57e55afcb409	Standard	{}	/uploads/daa61d10-22c1-4a66-a242-1e51e749af4c.jpg	/uploads/559bb20b-62e0-4076-8d8f-89792116eb2b.jpg
bee0a14b-dc62-4dd9-9d4f-94c907ae7a97	\N	Frost Beam Cannon	\N	\N	39a4b1b1-68e5-4aac-9a31-57e55afcb409	S	{}	/uploads/64631777-a611-4d19-a133-202b66dd35f3.jpg	/uploads/7723c0a9-7cb2-47bf-a40a-f3d971416e89.jpg
a1ebbbb6-6abe-4102-bb31-ecd73e697c45	\N	Frost Core Cannon	\N	\N	39a4b1b1-68e5-4aac-9a31-57e55afcb409	S	{}	/uploads/577ff8ad-6064-4eec-bae3-1ee36408df21.jpg	/uploads/7b5f7076-9953-4952-b84c-f32351da6c02.jpg
6f93f2d2-3b6e-4691-84d3-16f9218b8a0c	\N	Ice Drill	\N	\N	39a4b1b1-68e5-4aac-9a31-57e55afcb409	Standard	{}	/uploads/61e924b2-7918-450e-9e6d-24b814977e13.jpg	/uploads/6f00642f-7a13-4c6c-8310-2b79e744c1bd.jpg
deaf8dcf-ced7-405b-8ccd-61c443673c93	\N	Ice Shark	\N	\N	39a4b1b1-68e5-4aac-9a31-57e55afcb409	S	{}	/uploads/4fa8f928-c11a-4f64-b40a-90f9b45e3547.jpg	/uploads/74c0b0e6-4a6e-42be-9f81-5dd5d6503263.jpg
10383428-e582-446d-80ad-b934c311acda	\N	Meteor Cannon	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	S	{}	/uploads/a7d32f45-5e56-4f25-bb3c-02fc9c623e3f.jpg	/uploads/2254a36f-24be-40cb-8ee6-65a28a218791.jpg
5fc9c6cd-9a53-4dd5-8afb-93a1b0699aad	\N	Thunder Spear	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/69b64170-2b24-49f2-8bee-b5b5faba61c2.jpg	/uploads/6f521a5d-a5f5-447e-b830-644e5860244a.jpg
cb664d6c-f08b-4762-9d8b-cb96bfeea7b2	\N	Missile Launcher	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	Standard	{}	/uploads/0bc7d177-9613-47e0-af2f-09d2bb11e6e2.jpg	/uploads/a3d8438b-0e7a-44dc-a220-bce0f7e20398.jpg
9e491ce9-90c7-41fe-bf4c-61d6e249b0b2	\N	Void Obliterator	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	S	{}	/uploads/58c9bd9e-0f13-4f8e-b8fb-65b2903117dc.jpg	/uploads/3f9ad904-2ff4-4f6a-a29d-0638c4706605.jpg
52e7886d-0b83-41be-a157-47b2bb99985f	\N	Seed Gun	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	S	{}	/uploads/6fd692c8-01b8-42c2-b3fd-c3dea045f765.jpg	/uploads/af2caa31-29ab-4b64-874a-9715207029e4.jpg
d8a9e817-afef-4d2b-9cfe-3d6ace2529e2	\N	Fireworks Gatling Gun	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	S	{}	/uploads/97582270-3cca-423d-9adb-30051daf03fa.jpg	/uploads/ca1f3b00-2d9e-49c8-a888-d5e0c5fe3800.jpg
d498931e-9321-4f1a-a9e2-7685fcd64a69	\N	Iron Eagle	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	S	{}	/uploads/4f8e58f7-3a67-48e5-944f-5b97f1d6fae0.jpg	/uploads/0ae7fbd2-7039-41cc-ba29-e45518e82940.jpg
ee348817-74d2-4f14-83b5-306964cb5da9	\N	Mortal Cannon	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	Standard	{}	/uploads/88753f77-e872-4b4c-85ec-fb98a536d18f.jpg	/uploads/4810c070-927f-40b5-9b72-39875bed5c11.jpg
a70d3aa7-d788-4cde-a745-df842ccb4b6e	\N	Judgment Cannon	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	S	{}	/uploads/9fbe0abc-c38a-47b4-a3df-4810822a143d.jpg	/uploads/c049e518-faf7-4ef0-81ca-7993b006746b.jpg
671895ba-5649-46ba-98cd-199f9d5710e6	\N	Neon Speaker	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	S	{}	/uploads/0019d9cc-f90b-43d6-a892-2d18adb070b5.jpg	/uploads/c4fa4e70-4338-4b41-885e-4bf584d6cd80.jpg
2eecd419-48f2-4016-bbb8-89ce167501aa	\N	Laser Cannon	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	Standard	{}	/uploads/76a3ca73-4832-47c2-93cd-4331199ebc51.jpg	/uploads/0e95d62c-c72f-459b-8989-ef61ca311ef7.jpg
139a7212-ab3e-4172-95c3-e0e7dfb4782f	\N	Orbital Cannon	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	S	{}	/uploads/12a07510-2bed-49fa-a923-8a8e4b371e69.jpg	/uploads/37141e7b-e305-49e7-a3d6-f6f2431215b5.jpg
b99e0d80-2805-4fdb-b9aa-7fd0e0bc36ac	\N	Thunder Cannon	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/33ba0db6-b761-4df8-ad6c-02047a81a133.jpg	/uploads/b9775931-b0a1-40f6-9ddd-4298866fd3ca.jpg
a5409e64-78ee-46dc-89eb-d956e1c7e532	\N	Laser Turret	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	Standard	{}	/uploads/c36621da-b59a-4415-93b0-94251bfe923d.jpg	/uploads/a9d6dbb9-f9c8-4e02-8955-4bfabd80c7db.jpg
68419773-ef9a-42ad-a55f-b2cf8bfd6f9c	\N	Matrix Core	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/89fe8418-4032-4af2-9829-484675918529.jpg	/uploads/8ba12bc5-873e-44cb-a083-082db58d4bfa.jpg
77023a2c-fb38-4d38-9c62-ae39d95fbf56	\N	EM Singularity	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/2337b879-1fb8-4ad7-a120-a34b3a94f6bd.jpg	/uploads/1ae80b78-c0f7-4b3e-bd83-0c10b3ab03f8.jpg
5496bedd-6f37-4247-9325-f1cfb7b63cd8	\N	Lava Bomb	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	S	{}	/uploads/0cc0a8b7-2cbe-4197-8aab-fb026b27dc7d.jpg	/uploads/e3ab6b40-7071-4ca3-9164-832c29501c3c.jpg
cea694e3-24c4-42a6-b656-797411c3db5f	\N	Lightning Shield	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/a3a74ff7-76e7-459b-b53a-fca0dab4dee0.jpg	/uploads/54fbba7f-dd39-476c-ae72-13f603d98f46.jpg
69a331db-1a08-48cf-8edb-5e2046583101	\N	Meteoric Lightning	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/873f52ee-3dc7-4702-941c-d88e53d8a574.jpg	/uploads/a440d606-df3a-4c1c-a4b6-59f9a6b9af86.jpg
9ee3a9c1-2347-40a4-883a-66aae08273b8	\N	Alloy Shield	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	S	{}	/uploads/de4d370d-8403-44eb-87da-9814dbe63705.jpg	/uploads/4663c2eb-9d96-4e9e-ba7f-fba99fadd1c4.jpg
8a2ae803-9b53-4ea4-b280-7d85263a3bc3	\N	Azura Thunder Blade	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	S	{}	/uploads/b3dcc625-5414-4920-a0ba-4f3d190f7359.jpg	/uploads/751118c1-920b-4238-b1cc-5452b51315bc.jpg
2765bc1c-aaa7-4079-b7c4-563daf57de63	\N	Blast Cannon	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	S	{}	/uploads/87b8f6b8-58d4-47a1-93ff-dc2bacb80c70.jpg	/uploads/ba241769-5770-41db-8ba4-02b8b095fc7e.jpg
c318dde8-fc44-4702-875c-19b038ba80c2	\N	Blazing Gourd	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	S	{}	/uploads/1005b299-678c-4b18-bd82-7c3e8da3ee2c.jpg	/uploads/15a97c9a-5848-4835-a97f-bb68cdfebf93.jpg
b991c15e-b21d-4865-bfad-af1fb9a96375	\N	Buzzsaw	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	Standard	{}	/uploads/181f30e7-df47-4011-b8e7-c725396988ae.jpg	/uploads/6c94a452-2138-49ca-a278-2cdb9dc0f8ed.jpg
b6b16974-943e-439d-b8ea-5c9a819812bf	\N	Chain Ball	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	Standard	{}	/uploads/23cd3abd-6c46-4b53-8f22-de5bcc842c6f.jpg	/uploads/41abcce7-f350-4973-8006-d248119c01f2.jpg
29327bc3-3f70-4ee6-943a-884f7a83977c	\N	Christmas Sleigh	\N	\N	86ab792d-d234-4702-a021-779e39aabe32	S	{}	/uploads/549add8f-51e5-4f88-8ee5-4ab0c20e6e86.jpg	/uploads/915d1894-c708-43af-b9b8-1898b99bc4bd.jpg
4d6cd749-bafc-4ded-bdf9-94f81b9a88f6	\N	Demon Cannon	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	S	{}	/uploads/5ea80299-e9df-4595-aed9-020abca563e0.jpg	/uploads/c255a6e5-2510-4c0a-8bd3-07eadbc0b5c2.jpg
39490f40-09e2-4c8d-a447-67078ec413eb	\N	Electriomagnetic Coils	\N	\N	92c90c03-21d5-44f0-8be9-9f6548d3ab11	Standard	{}	/uploads/c7c6913a-1b86-48c0-9f65-31c7c4bee1c0.jpg	/uploads/276d7986-2b3e-4033-ae31-b8cfcfa79284.jpg
df3a5eba-ed30-4368-bce7-859f54bc2274	\N	Fire Archer	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	Standard	{}	/uploads/885958af-7684-4df4-8184-87e01bcf4a31.jpg	/uploads/445c774d-2de1-4406-a7b3-db248b8cfb3d.jpg
96db7825-30db-4416-a6d2-9852556f92e2	\N	Scorching Sunpiercer	\N	\N	94b3df23-fe2f-4155-9bd0-b3449544ddd3	S	{}	/uploads/c8da9fec-2ad3-434f-9d34-5c08a18919b8.jpg	/uploads/01dc317d-44ad-4dd8-86c8-c380fb4b2d45.jpg
0267a7a9-c29e-4a3c-8440-4060cc92adf0	\N	Qinggang Sword	\N	\N	470e9b8f-fd3a-4ab8-b588-3e43e490445c	S	{}	/uploads/fa54f00e-1963-49f3-9742-8ce74636a909.jpg	/uploads/fa55fb3c-1dc4-438f-8f1e-be15f0fb93e3.jpg
16cb32cd-3a14-45bc-a55d-f9ca1c2129e7	\N	Starburst	\N	\N	f6b13a07-6376-40fe-a29b-99c78f118ed5	S	{}	/uploads/a702b565-bdeb-410b-9943-efd5060ca096.jpg	/uploads/8a1ef10b-9c94-47ea-b56c-935de21f7604.jpg
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accessories accessories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_pkey PRIMARY KEY (id);


--
-- Name: awakening_levels awakening_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_levels
    ADD CONSTRAINT awakening_levels_pkey PRIMARY KEY (id);


--
-- Name: awakening_nodes awakening_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_nodes
    ADD CONSTRAINT awakening_nodes_pkey PRIMARY KEY (id);


--
-- Name: awakening_unlocks awakening_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_unlocks
    ADD CONSTRAINT awakening_unlocks_pkey PRIMARY KEY (id);


--
-- Name: build_hearts build_hearts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_hearts
    ADD CONSTRAINT build_hearts_pkey PRIMARY KEY (build_id, user_id);


--
-- Name: builds builds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_pkey PRIMARY KEY (id);


--
-- Name: helper_ranks helper_ranks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helper_ranks
    ADD CONSTRAINT helper_ranks_pkey PRIMARY KEY (id);


--
-- Name: helpers helpers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_pkey PRIMARY KEY (id);


--
-- Name: mech_skills mech_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mech_skills
    ADD CONSTRAINT mech_skills_pkey PRIMARY KEY (id);


--
-- Name: mech_traits mech_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mech_traits
    ADD CONSTRAINT mech_traits_pkey PRIMARY KEY (id);


--
-- Name: mechs mechs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechs
    ADD CONSTRAINT mechs_pkey PRIMARY KEY (id);


--
-- Name: pilots pilots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilots
    ADD CONSTRAINT pilots_pkey PRIMARY KEY (id);


--
-- Name: skill_nodes skill_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_nodes
    ADD CONSTRAINT skill_nodes_pkey PRIMARY KEY (id);


--
-- Name: skill_upgrades skill_upgrades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_upgrades
    ADD CONSTRAINT skill_upgrades_pkey PRIMARY KEY (id);


--
-- Name: skin_stars skin_stars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skin_stars
    ADD CONSTRAINT skin_stars_pkey PRIMARY KEY (id);


--
-- Name: skins skins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skins
    ADD CONSTRAINT skins_pkey PRIMARY KEY (id);


--
-- Name: traits traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traits
    ADD CONSTRAINT traits_pkey PRIMARY KEY (id);


--
-- Name: types types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weapon_skins weapon_skins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_skins
    ADD CONSTRAINT weapon_skins_pkey PRIMARY KEY (id);


--
-- Name: weapon_upgrades weapon_upgrades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_upgrades
    ADD CONSTRAINT weapon_upgrades_pkey PRIMARY KEY (id);


--
-- Name: weapons weapons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_pkey PRIMARY KEY (id);


--
-- Name: accessories_mech_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX accessories_mech_id_key ON public.accessories USING btree (mech_id);


--
-- Name: awakening_levels_mech_id_level_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX awakening_levels_mech_id_level_key ON public.awakening_levels USING btree (mech_id, level);


--
-- Name: awakening_nodes_level_id_position_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX awakening_nodes_level_id_position_key ON public.awakening_nodes USING btree (level_id, "position");


--
-- Name: helper_ranks_helper_id_rank_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX helper_ranks_helper_id_rank_key ON public.helper_ranks USING btree (helper_id, rank);


--
-- Name: mech_traits_mech_id_trait_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mech_traits_mech_id_trait_id_key ON public.mech_traits USING btree (mech_id, trait_id);


--
-- Name: mechs_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mechs_name_key ON public.mechs USING btree (name);


--
-- Name: pilots_mech_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pilots_mech_id_key ON public.pilots USING btree (mech_id);


--
-- Name: pilots_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pilots_name_key ON public.pilots USING btree (name);


--
-- Name: pilots_weapon_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pilots_weapon_id_key ON public.pilots USING btree (weapon_id);


--
-- Name: skin_stars_skin_id_star_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX skin_stars_skin_id_star_key ON public.skin_stars USING btree (skin_id, star);


--
-- Name: traits_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX traits_name_key ON public.traits USING btree (name);


--
-- Name: types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX types_name_key ON public.types USING btree (name);


--
-- Name: users_auth0_sub_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_auth0_sub_key ON public.users USING btree (auth0_sub);


--
-- Name: users_nickname_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_nickname_key ON public.users USING btree (nickname);


--
-- Name: weapons_mech_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX weapons_mech_id_key ON public.weapons USING btree (mech_id);


--
-- Name: accessories accessories_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: awakening_levels awakening_levels_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_levels
    ADD CONSTRAINT awakening_levels_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: awakening_nodes awakening_nodes_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_nodes
    ADD CONSTRAINT awakening_nodes_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.awakening_levels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: awakening_unlocks awakening_unlocks_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awakening_unlocks
    ADD CONSTRAINT awakening_unlocks_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.awakening_levels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: build_hearts build_hearts_build_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_hearts
    ADD CONSTRAINT build_hearts_build_id_fkey FOREIGN KEY (build_id) REFERENCES public.builds(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: build_hearts build_hearts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_hearts
    ADD CONSTRAINT build_hearts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: builds builds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: helper_ranks helper_ranks_helper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helper_ranks
    ADD CONSTRAINT helper_ranks_helper_id_fkey FOREIGN KEY (helper_id) REFERENCES public.helpers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: helpers helpers_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: helpers helpers_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mech_skills mech_skills_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mech_skills
    ADD CONSTRAINT mech_skills_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mech_traits mech_traits_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mech_traits
    ADD CONSTRAINT mech_traits_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mech_traits mech_traits_trait_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mech_traits
    ADD CONSTRAINT mech_traits_trait_id_fkey FOREIGN KEY (trait_id) REFERENCES public.traits(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mechs mechs_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechs
    ADD CONSTRAINT mechs_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pilots pilots_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilots
    ADD CONSTRAINT pilots_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pilots pilots_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilots
    ADD CONSTRAINT pilots_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: skill_nodes skill_nodes_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_nodes
    ADD CONSTRAINT skill_nodes_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_nodes skill_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_nodes
    ADD CONSTRAINT skill_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.skill_nodes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: skill_nodes skill_nodes_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_nodes
    ADD CONSTRAINT skill_nodes_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_upgrades skill_upgrades_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_upgrades
    ADD CONSTRAINT skill_upgrades_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.skill_upgrades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: skill_upgrades skill_upgrades_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_upgrades
    ADD CONSTRAINT skill_upgrades_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.mech_skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skin_stars skin_stars_skin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skin_stars
    ADD CONSTRAINT skin_stars_skin_id_fkey FOREIGN KEY (skin_id) REFERENCES public.skins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skins skins_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skins
    ADD CONSTRAINT skins_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: weapon_skins weapon_skins_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_skins
    ADD CONSTRAINT weapon_skins_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: weapon_upgrades weapon_upgrades_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_upgrades
    ADD CONSTRAINT weapon_upgrades_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.weapon_upgrades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: weapon_upgrades weapon_upgrades_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_upgrades
    ADD CONSTRAINT weapon_upgrades_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: weapons weapons_mech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_mech_id_fkey FOREIGN KEY (mech_id) REFERENCES public.mechs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: weapons weapons_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict yyjgjtXxt7F3yqH3CNuKyN7OaFxYNUnCzLmJ2jXSCW7Ev5p5bcfmtKutYqWbhuN

