"use client";

import { getAccount, useOkto } from "@okto_web3/react-sdk";
import { useState } from "react";

export default function Home() {
  const oc = useOkto();

  const [idToken, setIdToken] = useState("");
  const [user, setUser] = useState<string | undefined>();
  const [account, setAccount] = useState("");

  const handleLogin = async () => {
    const user = await oc.loginUsingOAuth({
      idToken: idToken,
      provider: "google",
    });

    setUser(JSON.stringify(user, null, 2));
  };

  const handleAccount = async () => {
    getAccount(oc).then((account) => {
      setAccount(JSON.stringify(account, null, 2));
    });
  };

  const handleTest = () => {
    console.log("Test");

    console.log(oc);

    console.log(oc.userSWA);
  };

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page.</p>

      <h2>Login</h2>
      <textarea
        value={idToken}
        onChange={(e) => setIdToken(e.target.value)}
        placeholder="Enter your ID token"
        rows={4}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <button
        onClick={() => {
          handleLogin();
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Login
      </button>

      <br />

      <h2>User</h2>

      <pre>
        <code>{user}</code>
      </pre>

      <br />

      <button onClick={handleTest}>Test</button>

      <h2>Account</h2>

      <button
        onClick={() => {
          handleAccount();
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Get Account
      </button>

      <pre>
        <code>{account}</code>
      </pre>
    </div>
  );
}
