SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 0oQfVzea0uYCbX7RFFxW0tx6JElToiFaoEK2evlLyyvAJqvc6jBt3lI5zjIaqZ6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activity_logs" ("id", "entity_type", "entity_id", "action", "description", "performed_by", "metadata", "created_at") VALUES
	('0d992c42-c204-40a2-ac60-3f51001df95a', 'asset', '024d01bf-8146-4931-b4f6-e3df0f04712a', 'created', 'Asset created: MacBook Pro 14"', NULL, '{"asset_code": "AST-1001"}', '2026-07-22 09:19:25.552951+00'),
	('6897492f-96ec-40aa-ae15-dc193ab23040', 'asset', '98c53b0d-6a36-47b2-ba8d-7d1eb9496235', 'created', 'Asset created: Dell XPS 15', NULL, '{"asset_code": "AST-1002"}', '2026-07-22 09:19:25.552951+00'),
	('f54f651d-d995-41b2-ab86-9b83c10b1d14', 'asset', '8fe2110f-cfa0-4cbc-ab36-aa62a9d91843', 'created', 'Asset created: Dell UltraSharp 27"', NULL, '{"asset_code": "AST-1003"}', '2026-07-22 09:19:25.552951+00'),
	('7f1ed5ac-7dc3-4e73-9596-91b3d77e400b', 'asset', '136e33be-af1d-4a4b-a8b0-68bbabf24df7', 'created', 'Asset created: Logitech MX Master 3S', NULL, '{"asset_code": "AST-1004"}', '2026-07-22 09:19:25.552951+00'),
	('f7f25349-74f3-4bfe-bc30-a3db9baa4f9e', 'asset', '567dfa24-c2d4-4714-9361-f436f7baa9c7', 'created', 'Asset created: Logitech MX Keys', NULL, '{"asset_code": "AST-1005"}', '2026-07-22 09:19:25.552951+00'),
	('6cc15f14-484b-4dc4-aa6d-aa541137a2b2', 'asset', 'e6cb519d-3c54-4a01-9055-5e8898e9d8af', 'created', 'Asset created: iPhone 15 Pro', NULL, '{"asset_code": "AST-1006"}', '2026-07-22 09:19:25.552951+00'),
	('c8adbe9b-8f27-4b62-85bf-fcb0a4465e02', 'asset', '5bfb71e5-149f-4f1e-b2c1-046f9fc6b46f', 'created', 'Asset created: iPad Pro 12.9"', NULL, '{"asset_code": "AST-1007"}', '2026-07-22 09:19:25.552951+00'),
	('af4461cb-a999-459d-879b-da4d17445622', 'asset', '68bf9c88-d307-48ba-b56b-5de92db4429c', 'created', 'Asset created: HP LaserJet Pro', NULL, '{"asset_code": "AST-1008"}', '2026-07-22 09:19:25.552951+00'),
	('b251674e-c05a-4bfe-8da0-aed4dc8ac608', 'asset', '2d1672b2-3e92-4403-b12b-63040effb32b', 'created', 'Asset created: Herman Miller Aeron', NULL, '{"asset_code": "AST-1009"}', '2026-07-22 09:19:25.552951+00'),
	('6e6b7df6-7387-4cc9-92df-442ae521f68d', 'asset', '4d644229-ef6e-40f4-98b4-a89be0e6ed3d', 'created', 'Asset created: Dell WD19 Dock', NULL, '{"asset_code": "AST-1010"}', '2026-07-22 09:19:25.552951+00'),
	('a9e988a5-f091-4683-bb0c-c28b87eead3b', 'asset', '0d6255d4-d7f4-4593-9fd7-63272fad58fc', 'created', 'Asset created: MacBook Air 13"', NULL, '{"asset_code": "AST-1011"}', '2026-07-22 09:19:25.552951+00'),
	('5a2d5bea-c49a-4a1b-8b62-d3a6ddfa1cb5', 'asset', '88fdd2b4-c0ee-480a-bce0-ed8d38d81e08', 'created', 'Asset created: Dell OptiPlex 7010', NULL, '{"asset_code": "AST-1012"}', '2026-07-22 09:19:25.552951+00'),
	('e73994b8-08f5-4299-9e5a-4beca772b3c6', 'asset', '489a806f-0327-4307-80ff-f76d4d29c996', 'created', 'Asset created: mac', NULL, '{"asset_code": "DE-4459"}', '2026-07-22 10:35:09.442734+00'),
	('41f12f50-366e-41ba-b913-a51b99b38b34', 'asset', '4ae188e3-488f-4428-b0b8-1ae033905e7e', 'created', 'Asset created: mac2', NULL, '{"asset_code": "LA-7291"}', '2026-07-22 10:40:56.597038+00'),
	('9fe74c55-b010-4b58-9a6a-9e0039f1a927', 'asset', '26b37c34-a127-4682-a394-4821b9a94fc8', 'created', 'Asset created: mac', NULL, '{"asset_code": "LA-3283"}', '2026-07-23 05:17:20.990017+00'),
	('64e8097a-c296-45a5-80dc-3d0f06503d0d', 'asset', '26b37c34-a127-4682-a394-4821b9a94fc8', 'status_changed', 'Asset status changed from available to assigned', NULL, '{"to_status": "assigned", "from_status": "available"}', '2026-07-23 05:17:46.546233+00'),
	('3daf57eb-3093-4da5-8c81-cfd49e03e524', 'asset', '26b37c34-a127-4682-a394-4821b9a94fc8', 'assigned', 'Asset assigned', NULL, '{"employee_id": "8a6c884e-ab14-40d1-85e8-ffbb253660ab"}', '2026-07-23 05:17:46.546233+00'),
	('7347faaf-2477-4080-b496-bc598d28c70c', 'asset', '489a806f-0327-4307-80ff-f76d4d29c996', 'status_changed', 'Asset status changed from assigned to repair', NULL, '{"to_status": "repair", "from_status": "assigned"}', '2026-07-23 05:53:50.463116+00'),
	('c8abeb28-c7bf-4e09-a9d8-38b1636e73d8', 'asset', '489a806f-0327-4307-80ff-f76d4d29c996', 'unassigned', 'Asset unassigned', NULL, '{"employee_id": null}', '2026-07-23 05:53:50.463116+00'),
	('4cd62582-94d0-45fe-bcf9-e0566390b213', 'asset', '489a806f-0327-4307-80ff-f76d4d29c996', 'status_changed', 'Asset status changed from repair to available', NULL, '{"to_status": "available", "from_status": "repair"}', '2026-07-23 05:55:09.626573+00'),
	('d8513726-1fa1-42b8-82fe-cb026cec910c', 'asset', '2f2f5e3b-8438-4930-a907-c4d4c05699bc', 'created', 'Asset created: MAC', NULL, '{"asset_code": "AI-LAP003"}', '2026-07-23 06:48:13.283064+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "category_name", "created_at", "description", "status", "icon", "updated_at") VALUES
	('85fd1ed4-f1ff-4a6b-adc4-49215bb56915', 'Desktop', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('4c572ab1-0878-4c1e-b311-9127e09d56d5', 'Docking Station', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('3510d757-18bf-471a-a375-875eab174854', 'Furniture', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('feceb20e-4a61-44c8-a054-772fb2712a8d', 'Keyboard', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('21521aec-109b-4d29-b2a9-8d6df0144272', 'Laptop', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('015f31f6-3201-4d09-832e-2df64e11b76e', 'Laptops', '2026-07-22 10:08:58.051606+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('8c874168-8abb-40fe-aa72-e4f861af3ffa', 'Mobile', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('094ad670-4b5e-4447-b6f8-0b17f6d24203', 'Monitor', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('b8cc9c70-6132-434e-b880-47edd52cd414', 'Monitors', '2026-07-22 10:08:58.051606+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('3b1b1fd2-daf6-4235-a0fd-59784c216aca', 'Mouse', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('6c50867b-74f8-4688-b088-4aaf0533028f', 'Other', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('b2b28ee3-26fb-420e-9a63-a9b5d54f1f72', 'Peripherals', '2026-07-22 10:08:58.051606+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('294793fd-8b0b-44e7-91a5-0f4b10920f9f', 'Phones', '2026-07-22 10:08:58.051606+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('b3de3e4f-599e-43b6-a375-e9cc01b5fd44', 'Printer', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00'),
	('55563661-8aeb-450f-b877-cf7165aeb995', 'Tablet', '2026-07-22 09:19:53.196257+00', NULL, 'active', NULL, '2026-07-23 07:52:07.713434+00');


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employees" ("id", "employee_code", "name", "email", "department", "designation", "manager", "location", "user_id", "created_at", "updated_at", "phone", "status") VALUES
	('facd68fa-aa4a-4d00-bf0a-9d6cad0d8bd4', 'A105', 'rahul', 'ra@gmail.com', 'delivery', 'associate', NULL, 'bengaluru', NULL, '2026-07-22 10:39:51.196994+00', '2026-07-23 07:52:08.042569+00', '986613524', 'active'),
	('8a6c884e-ab14-40d1-85e8-ffbb253660ab', 'AI1011', 'Somashekar', 'So@gmail.com', 'delivery', 'Associate', NULL, 'blr', NULL, '2026-07-23 04:47:30.809383+00', '2026-07-23 07:52:08.042569+00', '7483293721', 'active'),
	('815f88cf-455b-4606-81c4-dc3221a74b0e', 'AI123', 'Varsha', 'va@gmail.com', 'delivery', 'intern', NULL, 'bengaluru', NULL, '2026-07-22 10:14:41.306528+00', '2026-07-23 07:52:08.042569+00', '7483211844', 'active'),
	('1f4e6fda-836c-4292-bccc-91c72a5d466b', 'AI124', 'sagar', 'sa@gmail.com', 'delivery', 'intern', NULL, 'bengaluru', NULL, '2026-07-22 10:35:09.349986+00', '2026-07-23 07:52:08.042569+00', '9448733100', 'active');


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."vendors" ("id", "vendor_name", "contact_person", "email", "phone", "address", "created_at", "updated_at", "vendor_code", "office_address", "vendor_type", "status", "website", "gst_number", "notes") VALUES
	('212fe9f7-eb6b-4993-a140-74b8ca7caef2', 'Apple Inc.', 'Ravi Patel', 'ravi@apple.example', '+1-555-0102', NULL, '2026-07-22 09:19:53.325178+00', '2026-07-23 07:52:07.898013+00', 'VND-1001', 'Cupertino, CA', 'General Supplier', 'active', NULL, NULL, NULL),
	('01c88b72-c402-4b94-aec7-f31c3c64a416', 'Dell Technologies', 'Alice Kim', 'alice@dell.example', '+1-555-0101', NULL, '2026-07-22 09:19:53.325178+00', '2026-07-23 07:52:07.898013+00', 'VND-1002', 'Round Rock, TX', 'General Supplier', 'active', NULL, NULL, NULL),
	('36fef73a-1813-445b-b1be-730f2bcb86e5', 'Logitech', 'Sara Lee', 'sara@logitech.example', '+1-555-0103', NULL, '2026-07-22 09:19:53.325178+00', '2026-07-23 07:52:07.898013+00', 'VND-1003', 'Newark, CA', 'General Supplier', 'active', NULL, NULL, NULL),
	('f4379341-6f7f-49ed-b06b-e85e6eae8b4a', 'OfficeMax Furniture', 'Tom Chen', 'tom@officemax.example', '+1-555-0104', NULL, '2026-07-22 09:19:53.325178+00', '2026-07-23 07:52:07.898013+00', 'VND-1004', 'Naperville, IL', 'General Supplier', 'active', NULL, NULL, NULL);


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assets" ("id", "asset_code", "asset_name", "category_id", "brand", "model", "serial_number", "purchase_date", "purchase_cost", "vendor_id", "invoice_number", "warranty_start", "warranty_expiry", "status", "assigned_employee_id", "location", "remarks", "created_at", "updated_at", "purchase_cost_inr", "is_deleted", "deleted_at") VALUES
	('489a806f-0327-4307-80ff-f76d4d29c996', 'DE-4459', 'mac', '85fd1ed4-f1ff-4a6b-adc4-49215bb56915', 'apple', NULL, '12354', '2026-06-22', 123454.00, '212fe9f7-eb6b-4993-a140-74b8ca7caef2', 'fs234', NULL, '2027-07-22', 'available', NULL, 'bengaluru', NULL, '2026-07-22 10:20:03.698+00', '2026-07-23 07:52:08.21144+00', 123454.00, false, NULL),
	('4ae188e3-488f-4428-b0b8-1ae033905e7e', 'LA-7291', 'mac2', '21521aec-109b-4d29-b2a9-8d6df0144272', 'apple', NULL, '123fs', '2026-06-22', 876654.00, '212fe9f7-eb6b-4993-a140-74b8ca7caef2', '1234', NULL, '2027-06-22', 'available', NULL, 'bengaluru', NULL, '2026-07-22 10:40:56.003+00', '2026-07-23 07:52:08.21144+00', 876654.00, false, NULL),
	('26b37c34-a127-4682-a394-4821b9a94fc8', 'LA-3283', 'mac', '21521aec-109b-4d29-b2a9-8d6df0144272', 'apple', NULL, 'asfhq212a', '2026-07-22', 235234.00, '212fe9f7-eb6b-4993-a140-74b8ca7caef2', 'vfosir', NULL, '2027-07-22', 'assigned', '8a6c884e-ab14-40d1-85e8-ffbb253660ab', 'bengaluru', NULL, '2026-07-23 05:17:20.428+00', '2026-07-23 07:52:08.21144+00', 235234.00, false, NULL),
	('2f2f5e3b-8438-4930-a907-c4d4c05699bc', 'AI-LAP003', 'MAC', '21521aec-109b-4d29-b2a9-8d6df0144272', 'apple', NULL, '1234d', '2026-07-22', 234523.00, '212fe9f7-eb6b-4993-a140-74b8ca7caef2', 'INV-03', NULL, '2027-07-22', 'available', NULL, 'Bengaluru', NULL, '2026-07-23 06:48:12.602+00', '2026-07-23 07:52:08.21144+00', 234523.00, false, NULL);


--
-- Data for Name: asset_disposals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: asset_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assignments" ("id", "asset_id", "employee_id", "assigned_date", "expected_return_date", "returned_date", "status", "notes", "created_at", "updated_at", "reason", "performed_by") VALUES
	('85ef8c2c-c6a8-4df5-9e97-78182417c22f', '489a806f-0327-4307-80ff-f76d4d29c996', '815f88cf-455b-4606-81c4-dc3221a74b0e', '2026-07-22', NULL, NULL, 'active', NULL, '2026-07-22 10:25:09.262+00', '2026-07-23 07:52:08.36222+00', NULL, NULL),
	('9e5b5ff3-75b7-4b78-8708-68e203d6e9d5', '26b37c34-a127-4682-a394-4821b9a94fc8', '8a6c884e-ab14-40d1-85e8-ffbb253660ab', '2026-07-23', NULL, NULL, 'active', NULL, '2026-07-23 05:17:46.041+00', '2026-07-23 07:52:08.36222+00', NULL, NULL),
	('f5959e38-5e07-4f47-8cc5-ab8f0fb4a780', '489a806f-0327-4307-80ff-f76d4d29c996', '815f88cf-455b-4606-81c4-dc3221a74b0e', '2026-07-23', NULL, NULL, 'returned', NULL, '2026-07-23 05:53:49.835+00', '2026-07-23 07:52:08.36222+00', 'Sent for Repair', 'Varsha');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "name", "email", "created_at", "updated_at") VALUES
	('ed156ec5-ed53-49c6-84ac-e7acb0caad39', 'Varsha', 'varshatatti25@gmail.com', '2026-07-22 09:07:27.032929+00', '2026-07-22 09:07:27.032929+00');


--
-- Data for Name: repairs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."repairs" ("id", "asset_id", "issue", "repair_date", "completed_date", "repair_cost", "vendor_id", "status", "notes", "created_at", "updated_at", "expected_return_date", "actual_return_date", "repair_notes", "unassign_reason", "completed_at") VALUES
	('8830f214-fcb7-4e87-a5f3-66b52bc519fd', '489a806f-0327-4307-80ff-f76d4d29c996', 'Sent for Repair', '2026-07-23', NULL, 3000.00, '212fe9f7-eb6b-4993-a140-74b8ca7caef2', 'completed', NULL, '2026-07-23 05:53:49.835+00', '2026-07-23 07:52:08.509932+00', '2026-07-27', '2026-07-26', NULL, 'Sent for Repair', '2026-07-23 05:55:08.568+00');


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") VALUES
	('bc81ca97-8aca-4a32-9f86-d4821b88a372', 'ed156ec5-ed53-49c6-84ac-e7acb0caad39', 'administrator', '2026-07-22 09:07:27.032929+00');


--
-- Name: asset_code_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."asset_code_seq"', 1012, true);


--
-- Name: vendor_code_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."vendor_code_seq"', 1001, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 0oQfVzea0uYCbX7RFFxW0tx6JElToiFaoEK2evlLyyvAJqvc6jBt3lI5zjIaqZ6

RESET ALL;
