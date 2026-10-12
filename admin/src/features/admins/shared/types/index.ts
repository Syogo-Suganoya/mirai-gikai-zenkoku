export type Admin = {
  id: string;
  email: string;
  is_super_admin: boolean;
  /** 初期パスワードのまま（まだ変更していない） */
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type CreateAdminInput = {
  email: string;
};

export type AdminIdInput = {
  id: string;
};

/** 初期パスワードを発行したときの結果（パスワードはこのときだけ画面に出す） */
export type IssuedPasswordResult =
  | { success: true; email: string; initialPassword: string }
  | { error: string };
