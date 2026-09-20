export const seedIds = {
  doctors: {
    amira: "c1a1d0c0-0a11-4a11-8a11-000000000001",
    omar: "c1a1d0c0-0a11-4a11-8a11-000000000002",
    lina: "c1a1d0c0-0a11-4a11-8a11-000000000003",
  },
  appointments: {
    noraScan: "a9e0d1c0-0001-4000-8000-000000000001",
    karimFollowup: "a9e0d1c0-0001-4000-8000-000000000002",
    laylaCheckin: "a9e0d1c0-0001-4000-8000-000000000003",
    yusufOrtho: "a9e0d1c0-0001-4000-8000-000000000004",
    hanaCompleted: "a9e0d1c0-0001-4000-8000-000000000005",
    samiCancelled: "a9e0d1c0-0001-4000-8000-000000000006",
    raniaInternal: "a9e0d1c0-0001-4000-8000-000000000007",
  },
  imaging: {
    ctChest: "b8e0d1c0-0001-4000-8000-000000000001",
  },
} as const;

export const DICOM_FIXTURE_PATH = "fixtures/dicom/anonymized-ct.dcm";
