import React, { useState } from 'react';
import { Lock, Mail, User, Heart, Shield, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient' as 'patient' | 'doctor',
    licenseNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // サインアップロジック（デモ用）
        console.log('Sign up:', formData);
        // 実際にはAPIを呼び出してユーザーを作成
      } else {
        await login(formData.email, formData.password);
      }
      onLogin();
    } catch (error: any) {
      setErrors({ general: error.message || 'ログインに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Heart, text: '24時間対応のオンライン診療' },
    { icon: Shield, text: 'HIPAA準拠のセキュアな通信' },
    { icon: Calendar, text: '簡単な予約管理' },
    { icon: CheckCircle, text: 'AI診断支援機能' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* 左側: ログインフォーム */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">MIRYO</h1>
              <p className="text-gray-600 mt-2">
                {isSignUp ? '新規アカウント作成' : 'アカウントにログイン'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      お名前
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="山田太郎"
                        required={isSignUp}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アカウントタイプ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'patient' })}
                        className={`py-2 px-4 rounded-lg border transition ${
                          formData.role === 'patient'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        患者
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'doctor' })}
                        className={`py-2 px-4 rounded-lg border transition ${
                          formData.role === 'doctor'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        医師
                      </button>
                    </div>
                  </div>

                  {formData.role === 'doctor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        医師免許番号
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MD12345"
                        required={formData.role === 'doctor'}
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
              </button>

              {/* デモ用クイックログイン */}
              {!isSignUp && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500 text-center">デモ用クイックログイン</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, email: 'sarah@clinic.com', password: 'demo' });
                      }}
                      className="text-xs bg-gray-100 py-2 px-3 rounded hover:bg-gray-200"
                    >
                      医師としてログイン
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, email: 'john@email.com', password: 'demo' });
                      }}
                      className="text-xs bg-gray-100 py-2 px-3 rounded hover:bg-gray-200"
                    >
                      患者としてログイン
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントを新規作成'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 右側: 機能紹介 */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 p-12 items-center">
        <div className="text-white">
          <h2 className="text-4xl font-bold mb-6">
            次世代の遠隔診療を体験
          </h2>
          <p className="text-lg mb-8 opacity-90">
            MIRYOは、最新のAI技術と医療の専門知識を組み合わせた、
            安全で便利な遠隔診療プラットフォームです。
          </p>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
