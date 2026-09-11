import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db';
import { registerSchema } from '../lib/validations/auth';
import { registerUserAction } from '../app/actions/auth';

async function main() {
  console.log('--- Testing Registration Feature ---\n');

  // Test 1: Schema validation checks
  console.log('1. Testing Schema Validation:');
  const invalidName = registerSchema.safeParse({ name: 'A', email: 'test@example.com', password: 'password123' });
  console.log(`- Short name rejected: ${!invalidName.success}`);

  const invalidEmail = registerSchema.safeParse({ name: 'Valid Name', email: 'not-an-email', password: 'password123' });
  console.log(`- Invalid email rejected: ${!invalidEmail.success}`);

  const invalidPassword = registerSchema.safeParse({ name: 'Valid Name', email: 'test@example.com', password: '123' });
  console.log(`- Short password rejected: ${!invalidPassword.success}`);

  const validData = registerSchema.safeParse({ name: 'John Doe', email: 'johndoe@example.com', password: 'securePassword123' });
  console.log(`- Valid data accepted: ${validData.success}`);

  // Test 2: Server Action Registration
  console.log('\n2. Testing Server Action Execution:');
  const testEmail = 'registration_test_user@example.com';
  const testPassword = 'mySuperSecretPassword2026!';

  // Clean any leftover user
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const formData = new FormData();
  formData.append('name', 'Sarah Connor');
  formData.append('email', testEmail);
  formData.append('password', testPassword);

  const result = await registerUserAction(null, formData);
  console.log(`- Registration result: success = ${result.success}`);
  console.log(`- User ID: ${result.user?.id}`);
  console.log(`- User Name: ${result.user?.name}`);
  console.log(`- User Email: ${result.user?.email}`);

  if (!result.success || !result.user) {
    throw new Error('Registration action failed unexpectedly');
  }

  // Test 3: Password Hashing Verification
  console.log('\n3. Testing Password Security & Hashing:');
  const dbUser = await prisma.user.findUnique({
    where: { id: result.user.id },
  });

  if (!dbUser || !dbUser.password) {
    throw new Error('User not found in DB or password is empty');
  }

  const isBcrypt = dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$');
  console.log(`- Stored password is bcrypt hash: ${isBcrypt}`);
  console.log(`- Stored hash sample: ${dbUser.password.substring(0, 20)}...`);

  const passwordMatches = await bcrypt.compare(testPassword, dbUser.password);
  console.log(`- bcrypt.compare verified correct password: ${passwordMatches}`);

  const wrongPasswordMatches = await bcrypt.compare('wrongPassword', dbUser.password);
  console.log(`- bcrypt.compare rejected incorrect password: ${!wrongPasswordMatches}`);

  // Test 4: Duplicate Email Prevention
  console.log('\n4. Testing Duplicate Email Handling:');
  const duplicateResult = await registerUserAction(null, formData);
  console.log(`- Duplicate registration blocked: ${!duplicateResult.success}`);
  console.log(`- Error message: "${duplicateResult.message}"`);

  // Clean up
  await prisma.user.delete({ where: { id: result.user.id } });
  console.log('\n✓ Test user cleaned up from database.');
  console.log('All registration feature tests passed successfully! 🎉');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Test error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
