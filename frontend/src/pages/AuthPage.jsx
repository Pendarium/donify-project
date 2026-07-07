import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function AuthPage({ token, role, onRegister, onLogin, onLogout, onProfile, mode = 'login' }) {
  const location = useLocation();
  const [regUsername, setRegUsername] = useState('');
  const [regAssociationName, setRegAssociationName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRnaNumber, setRegRnaNumber] = useState('');
  const [signupType, setSignupType] = useState('user');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const isSignUp = mode === 'signup';

  useEffect(() => {
    // Keep auth forms empty whenever user lands on login/signup routes.
    setRegUsername('');
    setRegAssociationName('');
    setRegEmail('');
    setRegPassword('');
    setRegRnaNumber('');
    setSignupType('user');
    setLoginIdentifier('');
    setLoginPassword('');
  }, [location.key, mode]);

  return (
    <section className="auth-wrap">
      <article className="auth-panel card">
        <div className="auth-icon">D</div>
        <h2>{isSignUp ? 'Creer un compte' : 'Connexion'}</h2>
        <p className="muted">{isSignUp ? 'Rejoignez la communaute Donnify' : 'Connectez-vous a votre espace Donnify'}</p>

        {isSignUp ? (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              onRegister({
                username: signupType === 'user' ? regUsername : undefined,
                associationName: signupType === 'association' ? regAssociationName : undefined,
                email: regEmail,
                password: regPassword,
                role: signupType,
                rnaNumber: signupType === 'association' ? regRnaNumber : undefined,
              });
            }}
          >
            <div className="auth-switch" role="group" aria-label="Type de compte">
              <button
                type="button"
                className={signupType === 'user' ? 'chip active' : 'chip'}
                onClick={() => setSignupType('user')}
              >
                Compte utilisateur
              </button>
              <button
                type="button"
                className={signupType === 'association' ? 'chip active' : 'chip'}
                onClick={() => setSignupType('association')}
              >
                Compte association
              </button>
            </div>
            {signupType === 'association' ? (
              <input
                value={regAssociationName}
                onChange={(e) => setRegAssociationName(e.target.value)}
                placeholder="Nom de l'association"
                required
              />
            ) : (
              <input
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                required
              />
            )}
            <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} type="email" placeholder="Adresse e-mail" required />
            {signupType === 'association' && (
              <div className="auth-field-group">
                <input
                  value={regRnaNumber}
                  onChange={(e) => setRegRnaNumber(e.target.value)}
                  placeholder="Numero SIREN"
                  required
                />
              </div>
            )}
            <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} type="password" placeholder="Mot de passe" required />
            <button className="solid" type="submit">
              {signupType === 'association' ? 'Creer un compte association' : 'Creer mon compte utilisateur'}
            </button>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              onLogin({ identifier: loginIdentifier, password: loginPassword });
            }}
          >
            <input value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="Nom d'utilisateur ou e-mail" required />
            <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" placeholder="Mot de passe" required />
            <button className="solid" type="submit">Se connecter</button>
          </form>
        )}

        {token && (
          <div className="auth-tools">
            <button className="ghost" type="button" onClick={onProfile}>Voir le profil</button>
            <button className="danger" type="button" onClick={onLogout}>Deconnexion</button>
          </div>
        )}
      </article>
    </section>
  );
}
