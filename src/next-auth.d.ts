import {DefaultSession, DefaultUser} from "next-auth";

declare module "next-auth" {
    interface User extends DefaultUser {
        accessToken?: string;
    }

    interface Session {
        idToken?: string;
        user: {
            accessToken?: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        idToken?: string;
    }
}
