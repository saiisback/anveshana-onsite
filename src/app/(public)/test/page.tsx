import RegisterClient from "../register/register-client";
import DitherBackground from "@/components/dither-background";

export default function TestPage() {
  return (
    <DitherBackground>
      <RegisterClient
        token="test-token-123"
        invitedEmail="test@example.com"
      />
    </DitherBackground>
  );
}
