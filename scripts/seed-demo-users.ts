import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config as loadEnv } from "dotenv";
import { createClient, type User } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const accounts = [
  { email: "irfan@admin.com", fullName: "Irfan Admin", role: "admin" },
  { email: "irfan@doctor.com", fullName: "Irfan Doctor", role: "doctor" },
  { email: "irfan@patient.com", fullName: "Irfan Patient", role: "patient" },
] as const;

async function findAuthUser(email: string): Promise<User | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Could not look up ${email}: ${error.message}`);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );

    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }
}

async function createOrUpdateAuthUser(
  account: (typeof accounts)[number],
  password: string,
): Promise<string> {
  const existingUser = await findAuthUser(account.email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: account.fullName,
          role: account.role,
        },
      },
    );

    if (error) {
      throw new Error(`Could not update ${account.email}: ${error.message}`);
    }

    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      role: account.role,
    },
  });

  if (error) {
    throw new Error(`Could not create ${account.email}: ${error.message}`);
  }

  return data.user.id;
}

async function main() {
  const readline = createInterface({ input: stdin, output: stdout });
  let password: string;

  try {
    password = await readline.question(
      "Password for all three demo accounts (requested: password123): ",
    );
  } finally {
    readline.close();
  }

  if (password.length < 8) {
    throw new Error("Use a password with at least 8 characters.");
  }

  const profileIds = new Map<string, string>();

  for (const account of accounts) {
    profileIds.set(
      account.role,
      await createOrUpdateAuthUser(account, password),
    );
  }

  for (const account of accounts) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: profileIds.get(account.role),
        email: account.email,
        full_name: account.fullName,
        role: account.role,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(`Could not set up ${account.role} profile: ${error.message}`);
    }
  }

  const doctorProfileId = profileIds.get("doctor");
  const patientProfileId = profileIds.get("patient");

  if (!doctorProfileId || !patientProfileId) {
    throw new Error("Doctor or patient account was not created.");
  }

  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .upsert(
      {
        profile_id: doctorProfileId,
        specialization: "General Medicine",
        qualification: "MBBS",
        bio: "Demo doctor profile for testing the hospital management system.",
        consultation_fee: 1000,
        status: "available",
      },
      { onConflict: "profile_id" },
    )
    .select("id")
    .single();

  if (doctorError) {
    throw new Error(`Could not create the demo doctor record: ${doctorError.message}`);
  }

  const { data: existingSchedules, error: scheduleLookupError } = await supabase
    .from("doctor_schedules")
    .select("id")
    .eq("doctor_id", doctor.id)
    .limit(1);

  if (scheduleLookupError) {
    throw new Error(
      `Could not check the doctor schedule: ${scheduleLookupError.message}`,
    );
  }

  if (existingSchedules.length === 0) {
    const { error } = await supabase.from("doctor_schedules").insert(
      [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        doctor_id: doctor.id,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration_minutes: 30,
        is_active: true,
      })),
    );

    if (error) {
      throw new Error(`Could not create the demo doctor schedule: ${error.message}`);
    }
  }

  const { error: patientError } = await supabase.from("patients").upsert(
    {
      profile_id: patientProfileId,
      date_of_birth: "1995-01-01",
      blood_group: "O+",
      primary_doctor_id: doctor.id,
      stay_address: "Demo patient address",
      permanent_address: "Demo patient address",
    },
    { onConflict: "profile_id" },
  );

  if (patientError) {
    throw new Error(`Could not create the demo patient record: ${patientError.message}`);
  }

  console.log("Demo accounts are ready:");
  for (const account of accounts) {
    console.log(`- ${account.role}: ${account.email}`);
  }
  console.log("Use the password you entered at the prompt to sign in.");
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Demo account setup failed.",
  );
  process.exitCode = 1;
});
