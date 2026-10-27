import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArticleRounded,
  BookmarkBorderRounded,
  ChatBubbleOutlineRounded,
  CheckRounded,
  CloseRounded,
  GroupsRounded,
  HomeRounded,
  LogoutRounded,
  MailOutlineRounded,
  NotificationsNoneRounded,
  PersonAddAlt1Rounded,
  SearchRounded,
  SendRounded,
  ThumbUpAltOutlined,
  ThumbUpAltRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
} from "@mui/material";
import axios from "axios";
import "./App.css";

type Section =
  | "Home"
  | "My network"
  | "Jobs"
  | "Messaging"
  | "Notifications"
  | "My profile";
type AuthMode = "signin" | "signup" | "forgot" | "reset";
type Post = {
  id: number | string;
  name: string;
  role: string;
  time: string;
  initials: string;
  color: string;
  text: string;
  likes: number;
  comments: number;
  liked: boolean;
  tag?: string;
};
type ApiPost = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  reactions?: string[];
  comments?: unknown[];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("workline_access_token");
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
const navigation: { label: Section; icon: typeof HomeRounded }[] = [
  { label: "Home", icon: HomeRounded },
  { label: "My network", icon: GroupsRounded },
  { label: "Jobs", icon: WorkOutlineRounded },
  { label: "Messaging", icon: ChatBubbleOutlineRounded },
  { label: "Notifications", icon: NotificationsNoneRounded },
];
const initialPosts: Post[] = [
  {
    id: 1,
    name: "Olivia Rhye",
    role: "Design Director at Layers",
    time: "2h",
    initials: "OR",
    color: "#cf7052",
    text: "We just wrapped our first design systems sprint of the year. The best part was not the polished component library, it was watching product and engineering finally speak the same visual language.\n\nA few notes on making systems that teams actually want to use:",
    likes: 248,
    comments: 32,
    liked: false,
    tag: "Design systems",
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Staff Engineer · Openfield",
    time: "4h",
    initials: "MC",
    color: "#527b70",
    text: "A small reminder for anyone building with AI: the most useful question is not “what can we automate?” It is “what should stay human?”\n\nWe have been testing this with our support team, and the results changed how we think about product quality.",
    likes: 186,
    comments: 19,
    liked: true,
    tag: "Future of work",
  },
  {
    id: 3,
    name: "Priya Kapoor",
    role: "Founder, Common Thread",
    time: "6h",
    initials: "PK",
    color: "#8573a6",
    text: "Hiring our first two community leads. Looking for people who listen well, make introductions generously, and believe the best professional networks are built one thoughtful conversation at a time.",
    likes: 97,
    comments: 14,
    liked: false,
    tag: "Hiring",
  },
];
const people = [
  {
    name: "Sofia Andersson",
    role: "Product Designer at Fjord",
    mutual: "18 mutual connections",
    initials: "SA",
    color: "#b17b57",
  },
  {
    name: "Daniel Okafor",
    role: "Engineering Manager at Relay",
    mutual: "12 mutual connections",
    initials: "DO",
    color: "#506f81",
  },
  {
    name: "Yuki Tanaka",
    role: "Research Lead at Fieldnote",
    mutual: "9 mutual connections",
    initials: "YT",
    color: "#8b6c81",
  },
];
const jobs = [
  {
    title: "Senior Product Designer",
    company: "Linear",
    location: "Remote · United States",
    type: "Full-time",
    mark: "L",
    color: "#7564d8",
  },
  {
    title: "Product Engineer, Platform",
    company: "Notion",
    location: "New York, NY · Hybrid",
    type: "Full-time",
    mark: "N",
    color: "#222",
  },
  {
    title: "Design Systems Lead",
    company: "Figma",
    location: "San Francisco, CA · Hybrid",
    type: "Full-time",
    mark: "F",
    color: "#f07250",
  },
];

function App() {
  const [section, setSection] = useState<Section>("Home");
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authFields, setAuthFields] = useState({
    name: "",
    email: "",
    password: "",
    token: "",
  });
  const [connected, setConnected] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [activeConversation, setActiveConversation] = useState("Olivia Rhye");
  const [messageDraft, setMessageDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(
    Boolean(localStorage.getItem("workline_access_token")),
  );
  const queryClient = useQueryClient();
  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: async () => (await api.get<ApiPost[]>("/feed")).data,
    enabled: signedIn,
    retry: false,
  });
  const createPostMutation = useMutation({
    mutationFn: async (content: string) =>
      (await api.post<ApiPost>("/feed", { content })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });
  const reactionMutation = useMutation({
    mutationFn: async (postId: string) => api.post(`/feed/${postId}/reactions`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });
  const remotePosts = feedQuery.data?.map<Post>((post) => ({
    id: post.id,
    name: post.author_name,
    role: "Member of your professional network",
    time: "Recent",
    initials: post.author_name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    color: "#527b70",
    text: post.content,
    likes: post.reactions?.length ?? 0,
    comments: post.comments?.length ?? 0,
    liked: false,
  }));
  const feedPosts = signedIn && feedQuery.data ? (remotePosts ?? []) : posts;
  const filteredPosts = feedPosts.filter((post) =>
    `${post.name} ${post.role} ${post.text} ${post.tag ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const toggleLike = (id: Post["id"]) => {
    if (
      typeof id === "string" &&
      localStorage.getItem("workline_access_token")
    ) {
      reactionMutation.mutate(id);
      return;
    }
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      ),
    );
  };
  const publishPost = async () => {
    const text = draft.trim();
    if (!text) return;
    const nextPost: Post = {
      id: Date.now(),
      name: "Alex Morgan",
      role: "Product designer · San Francisco",
      time: "now",
      initials: "AM",
      color: "#47786d",
      text,
      likes: 0,
      comments: 0,
      liked: false,
    };
    if (localStorage.getItem("workline_access_token")) {
      try {
        await createPostMutation.mutateAsync(text);
      } catch {
        setAuthNotice(
          "Your post is saved in this preview. Connect the API to publish it to your account.",
        );
      }
    }
    setPosts((current) => [nextPost, ...current]);
    setDraft("");
    setComposerOpen(false);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");
    setAuthBusy(true);
    try {
      if (authMode === "signin" || authMode === "signup") {
        const path = authMode === "signin" ? "/auth/login" : "/auth/register";
        const body =
          authMode === "signin"
            ? { email: authFields.email, password: authFields.password }
            : {
                email: authFields.email,
                password: authFields.password,
                full_name: authFields.name,
              };
        const { data } = await api.post(path, body, {
          headers: { "Content-Type": "application/json" },
        });
        localStorage.setItem("workline_access_token", data.access_token);
        setSignedIn(true);
        setAuthOpen(false);
      } else if (authMode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", {
          email: authFields.email,
        });
        setAuthFields((current) => ({
          ...current,
          token: data.reset_token ?? "",
        }));
        setAuthNotice(
          data.reset_token
            ? "Development reset token received. Enter a new password to continue."
            : "If an account exists for this email, reset instructions are on their way.",
        );
        setAuthMode(data.reset_token ? "reset" : "signin");
      } else {
        await api.post("/auth/reset-password", {
          token: authFields.token,
          new_password: authFields.password,
        });
        setAuthMode("signin");
        setAuthNotice("Password updated. Sign in with your new password.");
      }
    } catch (error) {
      setAuthError(
        axios.isAxiosError(error)
          ? (error.response?.data?.detail ??
              "Could not reach the API. Start the backend and try again.")
          : "Something went wrong. Please try again.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const sendMessage = () => {
    if (messageDraft.trim()) {
      setSentMessages((current) => [...current, messageDraft.trim()]);
      setMessageDraft("");
    }
  };

  const openAuth = (mode: AuthMode = "signin") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setAuthError("");
    setAuthNotice("");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            onClick={() => setSection("Home")}
            aria-label="Workline home"
          >
            <span className="brand-mark">w</span>
            <span>workline</span>
          </button>
          <label className="search-box">
            <SearchRounded fontSize="small" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, roles, skills"
              aria-label="Search people, roles, skills"
            />
            {query && (
              <IconButton
                size="small"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            )}
          </label>
          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-item ${section === label ? "selected" : ""}`}
                onClick={() => setSection(label)}
              >
                <Icon />
                <span>{label}</span>
                {label === "Notifications" && (
                  <i className="notification-dot" />
                )}
              </button>
            ))}
          </nav>
          <div className="account-tools">
            <button
              className="profile-trigger"
              onClick={() => setSection("My profile")}
            >
              <Avatar
                sx={{ bgcolor: "#47786d", width: 30, height: 30, fontSize: 12 }}
              >
                AM
              </Avatar>
              <span>Me</span>
            </button>
            <span className="tool-divider" />
            {signedIn ? (
              <button
                className="sign-in-link"
                onClick={() => {
                  localStorage.removeItem("workline_access_token");
                  setSignedIn(false);
                  queryClient.removeQueries({ queryKey: ["feed"] });
                }}
              >
                <LogoutRounded fontSize="small" />
                Sign out
              </button>
            ) : (
              <button className="sign-in-link" onClick={() => openAuth()}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="workspace">
        <aside className="left-rail">
          <Card className="profile-card" elevation={0}>
            <div className="cover-art">
              <span>SF · CA</span>
            </div>
            <Avatar
              className="profile-avatar"
              sx={{ bgcolor: "#47786d", width: 66, height: 66 }}
            >
              AM
            </Avatar>
            <button
              className="profile-name"
              onClick={() => setSection("My profile")}
            >
              Alex Morgan
            </button>
            <p className="profile-role">
              Product designer building thoughtful digital experiences
            </p>
            <div className="profile-location">San Francisco Bay Area</div>
            <div className="profile-stats">
              <span>Profile viewers</span>
              <strong>284</strong>
            </div>
            <div className="profile-stats">
              <span>Post impressions</span>
              <strong>1,642</strong>
            </div>
            <button
              className="insight-link"
              onClick={() => setSection("My profile")}
            >
              <span>◎</span> View all analytics
            </button>
          </Card>
          <Card className="rail-card" elevation={0}>
            <div className="rail-title">Your workspace</div>
            <button
              className="rail-action"
              onClick={() => setSection("My network")}
            >
              <GroupsRounded /> My connections <strong>1,248</strong>
            </button>
            <button className="rail-action" onClick={() => setSection("Jobs")}>
              <BookmarkBorderRounded /> Saved items{" "}
              <strong>{savedJobs.length || 8}</strong>
            </button>
            <button className="rail-action" onClick={() => setSection("Jobs")}>
              <WorkOutlineRounded /> Job preferences
            </button>
          </Card>
          <div className="left-footer">
            About · Accessibility · Help center
            <br />
            Privacy & terms · Ad choices · More
            <br />
            <span>Workline Corporation © 2026</span>
          </div>
        </aside>

        <section className="main-column" aria-label={section}>
          {section === "Home" && (
            <>
              {query && (
                <div className="result-line">
                  Showing feed results for <strong>“{query}”</strong>
                </div>
              )}
              <Card className="composer-card" elevation={0}>
                <div className="composer-top">
                  <Avatar sx={{ bgcolor: "#47786d" }}>AM</Avatar>
                  <button
                    className="composer-prompt"
                    onClick={() => setComposerOpen(true)}
                  >
                    Share an insight, ask a question, or celebrate a win...
                  </button>
                </div>
                <div className="composer-actions">
                  <button onClick={() => setComposerOpen(true)}>
                    <span className="action-dot photo">▧</span>Photo
                  </button>
                  <button onClick={() => setComposerOpen(true)}>
                    <span className="action-dot event">▦</span>Event
                  </button>
                  <button onClick={() => setComposerOpen(true)}>
                    <span className="action-dot article">
                      <ArticleRounded />
                    </span>
                    Write an article
                  </button>
                </div>
              </Card>
              <div className="feed-sort">
                <span>For you</span>
                <span className="sort-line" />
                <button
                  onClick={() => setPosts((current) => [...current].reverse())}
                >
                  Most relevant <span>⌄</span>
                </button>
              </div>
              {filteredPosts.length ? (
                filteredPosts.map((post) => (
                  <Card className="post-card" key={post.id} elevation={0}>
                    <div className="post-header">
                      <Avatar sx={{ bgcolor: post.color }}>
                        {post.initials}
                      </Avatar>
                      <div className="post-author">
                        <strong>{post.name}</strong>
                        <span>{post.role}</span>
                        <span>
                          {post.time} · <span className="globe">◎</span>
                        </span>
                      </div>
                      <IconButton
                        className="more-button"
                        aria-label="More post options"
                      >
                        ···
                      </IconButton>
                    </div>
                    <p className="post-copy">{post.text}</p>
                    {post.tag && (
                      <button
                        className="post-tag"
                        onClick={() => setQuery(post.tag ?? "")}
                      >
                        #{post.tag.replaceAll(" ", "")}
                      </button>
                    )}
                    <div className="post-reactions">
                      <div className="reaction-bubbles">
                        <span>♥</span>
                        <span>👏</span>
                        <span>✦</span>
                      </div>
                      <span>{post.likes.toLocaleString()}</span>
                      <button
                        onClick={() =>
                          setAuthNotice(
                            "Comments are ready to connect when the API is running.",
                          )
                        }
                      >
                        {post.comments} comments
                      </button>
                    </div>
                    <div className="post-actions">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={post.liked ? "liked" : ""}
                      >
                        {post.liked ? (
                          <ThumbUpAltRounded />
                        ) : (
                          <ThumbUpAltOutlined />
                        )}{" "}
                        Like
                      </button>
                      <button
                        onClick={() =>
                          setAuthNotice(
                            "Comment threads are part of the API foundation.",
                          )
                        }
                      >
                        <ChatBubbleOutlineRounded /> Comment
                      </button>
                      <button
                        onClick={() =>
                          setAuthNotice(
                            "Your post is ready to share with your network.",
                          )
                        }
                      >
                        <SendRounded /> Share
                      </button>
                      <button
                        onClick={() =>
                          setAuthNotice("Saved to your reading list.")
                        }
                      >
                        <BookmarkBorderRounded /> Save
                      </button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="empty-card" elevation={0}>
                  <SearchRounded />
                  <strong>No posts found</strong>
                  <span>Try another name, skill, or topic.</span>
                </Card>
              )}
            </>
          )}

          {section === "My network" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR COMMUNITY</span>
                  <h1>My network</h1>
                  <p>People who make good work happen.</p>
                </div>
                <Chip label="1,248 connections" />
              </div>
              <Card className="network-summary" elevation={0}>
                <div>
                  <span className="eyebrow">GROW YOUR CIRCLE</span>
                  <h2>People you may know</h2>
                  <p>Thoughtful introductions start here.</p>
                </div>
                <button
                  onClick={() =>
                    setConnected(people.map((person) => person.name))
                  }
                >
                  View all <span>→</span>
                </button>
              </Card>
              <div className="people-grid">
                {people.map((person) => (
                  <Card key={person.name} className="person-card" elevation={0}>
                    <button
                      className="person-more"
                      aria-label={`More options for ${person.name}`}
                    >
                      ···
                    </button>
                    <Avatar
                      sx={{ bgcolor: person.color, width: 64, height: 64 }}
                    >
                      {person.initials}
                    </Avatar>
                    <strong>{person.name}</strong>
                    <p>{person.role}</p>
                    <small>{person.mutual}</small>
                    <Button
                      variant="outlined"
                      startIcon={
                        connected.includes(person.name) ? (
                          <CheckRounded />
                        ) : (
                          <PersonAddAlt1Rounded />
                        )
                      }
                      onClick={() =>
                        setConnected((current) =>
                          current.includes(person.name)
                            ? current.filter((name) => name !== person.name)
                            : [...current, person.name],
                        )
                      }
                    >
                      {connected.includes(person.name) ? "Pending" : "Connect"}
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {section === "Jobs" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR NEXT CHAPTER</span>
                  <h1>Find your next role</h1>
                  <p>Roles picked for your experience and interests.</p>
                </div>
              </div>
              <div className="job-search">
                <SearchRounded />
                <span>Product design, engineering, research...</span>
                <Button variant="contained">Search jobs</Button>
              </div>
              <div className="job-toolbar">
                <strong>Recommended for you</strong>
                <span>Based on your profile and activity</span>
              </div>
              {jobs.map((job) => (
                <Card className="job-card" elevation={0} key={job.title}>
                  <div
                    className="company-mark"
                    style={{ background: job.color }}
                  >
                    {job.mark}
                  </div>
                  <div className="job-content">
                    <strong>{job.title}</strong>
                    <span>{job.company}</span>
                    <small>{job.location}</small>
                    <Chip label={job.type} size="small" />
                  </div>
                  <IconButton
                    aria-label="Save job"
                    onClick={() =>
                      setSavedJobs((current) =>
                        current.includes(job.title)
                          ? current.filter((title) => title !== job.title)
                          : [...current, job.title],
                      )
                    }
                    className={savedJobs.includes(job.title) ? "saved" : ""}
                  >
                    <BookmarkBorderRounded />
                  </IconButton>
                </Card>
              ))}
            </>
          )}

          {section === "Messaging" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR INBOX</span>
                  <h1>Messaging</h1>
                  <p>Good conversations move work forward.</p>
                </div>
              </div>
              <Card className="messages-layout" elevation={0}>
                <div className="conversation-list">
                  <label className="inbox-search">
                    <SearchRounded />
                    <input placeholder="Search messages" />
                  </label>
                  {["Olivia Rhye", "Marcus Chen", "Priya Kapoor"].map(
                    (name, index) => (
                      <button
                        key={name}
                        onClick={() => setActiveConversation(name)}
                        className={
                          activeConversation === name
                            ? "conversation active"
                            : "conversation"
                        }
                      >
                        <Avatar
                          sx={{
                            bgcolor: ["#cf7052", "#527b70", "#8573a6"][index],
                          }}
                        >
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </Avatar>
                        <span>
                          <strong>{name}</strong>
                          <small>
                            {
                              [
                                "The prototype looks wonderful. Could we...",
                                "I sent over the notes from our review.",
                                "Thanks for the introduction!",
                              ][index]
                            }
                          </small>
                        </span>
                      </button>
                    ),
                  )}
                </div>
                <div className="conversation-view">
                  <div className="conversation-top">
                    <Avatar sx={{ bgcolor: "#cf7052" }}>
                      {activeConversation
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </Avatar>
                    <span>
                      <strong>{activeConversation}</strong>
                      <small>Connected · Active today</small>
                    </span>
                  </div>
                  <div className="message-history">
                    <span className="message-date">TODAY</span>
                    <div className="incoming-message">
                      Hi Alex! I saw your latest work and would love to hear
                      more about how you approached the research.
                    </div>
                    {sentMessages.map((message, index) => (
                      <div
                        className="outgoing-message"
                        key={`${message}-${index}`}
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                  <div className="message-compose">
                    <input
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      onKeyDown={(event) =>
                        event.key === "Enter" && sendMessage()
                      }
                      placeholder="Write a message..."
                    />
                    <IconButton onClick={sendMessage} aria-label="Send message">
                      <SendRounded />
                    </IconButton>
                  </div>
                </div>
              </Card>
            </>
          )}

          {section === "Notifications" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE LATEST</span>
                  <h1>Notifications</h1>
                  <p>Updates from your professional circle.</p>
                </div>
                <button
                  className="text-action"
                  onClick={() => setAuthNotice("All caught up.")}
                >
                  Mark all as read
                </button>
              </div>
              <Card className="notification-list" elevation={0}>
                {[
                  {
                    initials: "JR",
                    color: "#718b62",
                    text: "Jordan Rivera",
                    detail: "and 18 others appreciated your post.",
                    time: "12m",
                    icon: "♥",
                  },
                  {
                    initials: "EC",
                    color: "#567b90",
                    text: "Emily Chen",
                    detail: "viewed your profile.",
                    time: "1h",
                    icon: "◉",
                  },
                  {
                    initials: "LM",
                    color: "#ac795d",
                    text: "Leo Martin",
                    detail:
                      "commented: “This is exactly the kind of thinking our teams need.”",
                    time: "3h",
                    icon: "↪",
                  },
                  {
                    initials: "NW",
                    color: "#8e7191",
                    text: "Northwind Studio",
                    detail: "posted a new role that matches your preferences.",
                    time: "5h",
                    icon: "▣",
                  },
                ].map((item) => (
                  <div className="notification-row" key={item.text}>
                    <Avatar sx={{ bgcolor: item.color }}>
                      {item.initials}
                    </Avatar>
                    <span className="notification-mark">{item.icon}</span>
                    <p>
                      <strong>{item.text}</strong> {item.detail}
                      <small>{item.time}</small>
                    </p>
                    <button aria-label="Notification options">···</button>
                  </div>
                ))}
              </Card>
            </>
          )}

          {section === "My profile" && (
            <>
              <Card className="own-profile" elevation={0}>
                <div className="profile-cover">
                  <span>PRODUCT DESIGN · SAN FRANCISCO</span>
                </div>
                <div className="own-profile-content">
                  <Avatar sx={{ bgcolor: "#47786d", width: 88, height: 88 }}>
                    AM
                  </Avatar>
                  <Button variant="outlined" onClick={() => openAuth("signin")}>
                    Edit profile
                  </Button>
                  <h1>Alex Morgan</h1>
                  <p>
                    Product designer building thoughtful digital experiences
                  </p>
                  <span>
                    San Francisco Bay Area ·{" "}
                    <button
                      onClick={() =>
                        setAuthNotice(
                          "Contact details are visible to your connections.",
                        )
                      }
                    >
                      Contact info
                    </button>
                  </span>
                  <div className="profile-cta">
                    <Button
                      variant="contained"
                      onClick={() => setSection("Jobs")}
                    >
                      Open to work
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setAuthNotice("Profile link copied.")}
                    >
                      Share profile
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="profile-about" elevation={0}>
                <h2>About</h2>
                <p>
                  I partner with teams to turn complex problems into clear,
                  human experiences. Currently exploring the intersection of
                  design systems, responsible AI, and the future of work.
                </p>
                <div className="skill-list">
                  <Chip label="Product design" />
                  <Chip label="Design systems" />
                  <Chip label="User research" />
                  <Chip label="Prototyping" />
                </div>
              </Card>
              <Card className="profile-about experience-card" elevation={0}>
                <h2>Experience</h2>
                <div className="experience-row">
                  <div
                    className="company-mark"
                    style={{ background: "#47786d" }}
                  >
                    L
                  </div>
                  <span>
                    <strong>Product Designer</strong>
                    <small>Layers · Full-time</small>
                    <small>2022 – Present · San Francisco</small>
                  </span>
                </div>
              </Card>
            </>
          )}
        </section>

        <aside className="right-rail">
          <Card className="news-card" elevation={0}>
            <div className="news-header">
              <strong>Good to know</strong>
              <span>i</span>
            </div>
            <div className="news-kicker">YOUR DAILY BRIEFING</div>
            <button
              className="news-story"
              onClick={() =>
                setAuthNotice(
                  "Briefing stories will connect to your personalized news feed.",
                )
              }
            >
              The craft of building calmer products{" "}
              <small>3h ago · 4,820 readers</small>
            </button>
            <button
              className="news-story"
              onClick={() =>
                setAuthNotice(
                  "Briefing stories will connect to your personalized news feed.",
                )
              }
            >
              Inside the new generation of climate tech{" "}
              <small>5h ago · 2,130 readers</small>
            </button>
            <button
              className="news-story"
              onClick={() =>
                setAuthNotice(
                  "Briefing stories will connect to your personalized news feed.",
                )
              }
            >
              Why thoughtful teams are hiring for curiosity{" "}
              <small>7h ago · 1,906 readers</small>
            </button>
            <button
              className="news-more"
              onClick={() => setAuthNotice("More stories are coming soon.")}
            >
              Show more <span>→</span>
            </button>
          </Card>
          <Card className="ad-card" elevation={0}>
            <span className="ad-label">PROMOTED</span>
            <div className="ad-visual">
              <span>
                Make space
                <br />
                for better work.
              </span>
              <div>f.</div>
            </div>
            <p>
              Small teams. Big ideas. Meet the workspace that gets out of your
              way.
            </p>
            <Button
              variant="outlined"
              onClick={() =>
                setAuthNotice("Promotion links are disabled in preview mode.")
              }
            >
              Discover Fieldnote
            </Button>
          </Card>
          <div className="right-footer">
            About · Accessibility · Careers · Advertising
            <br />
            Privacy & terms · Cookie preferences
            <br />
            <strong>workline</strong> © 2026
          </div>
        </aside>
      </main>

      <Dialog
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <div className="dialog-heading">
          <strong>Create a post</strong>
          <IconButton onClick={() => setComposerOpen(false)} aria-label="Close">
            <CloseRounded />
          </IconButton>
        </div>
        <DialogContent className="composer-dialog">
          <div className="composer-person">
            <Avatar sx={{ bgcolor: "#47786d" }}>AM</Avatar>
            <span>
              <strong>Alex Morgan</strong>
              <small>
                Post to anyone · <span>◎</span>
              </small>
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What would you like to share?"
            autoFocus
          />
          <div className="dialog-actions">
            <span>Be thoughtful. Make it useful.</span>
            <Button
              variant="contained"
              disabled={!draft.trim()}
              onClick={publishPost}
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <div className="dialog-heading">
          <div className="brand">
            <span className="brand-mark">w</span>
            <span>workline</span>
          </div>
          <IconButton onClick={() => setAuthOpen(false)} aria-label="Close">
            <CloseRounded />
          </IconButton>
        </div>
        <DialogContent className="auth-dialog">
          <span className="eyebrow">YOUR PROFESSIONAL COMMUNITY</span>
          <h2>
            {authMode === "signup"
              ? "Join your network"
              : authMode === "forgot"
                ? "Reset your password"
                : authMode === "reset"
                  ? "Choose a new password"
                  : "Welcome back"}
          </h2>
          <p>
            {authMode === "signup"
              ? "Build meaningful connections and find your next opportunity."
              : authMode === "forgot"
                ? "We’ll send a secure link to your email address."
                : authMode === "reset"
                  ? "Enter the reset token and a new password."
                  : "Sign in to continue your professional journey."}
          </p>
          {authNotice && <div className="auth-notice">{authNotice}</div>}
          {authError && <div className="auth-error">{authError}</div>}
          <form onSubmit={submitAuth}>
            {authMode === "signup" && (
              <TextField
                label="Full name"
                value={authFields.name}
                onChange={(event) =>
                  setAuthFields({ ...authFields, name: event.target.value })
                }
                required
                fullWidth
                autoComplete="name"
              />
            )}
            {authMode !== "reset" && (
              <TextField
                label="Email address"
                type="email"
                value={authFields.email}
                onChange={(event) =>
                  setAuthFields({ ...authFields, email: event.target.value })
                }
                required
                fullWidth
                autoComplete="email"
              />
            )}
            {authMode === "reset" && (
              <TextField
                label="Reset token"
                value={authFields.token}
                onChange={(event) =>
                  setAuthFields({ ...authFields, token: event.target.value })
                }
                required
                fullWidth
              />
            )}
            {authMode !== "forgot" && (
              <TextField
                label={authMode === "reset" ? "New password" : "Password"}
                type="password"
                value={authFields.password}
                onChange={(event) =>
                  setAuthFields({ ...authFields, password: event.target.value })
                }
                required
                fullWidth
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                slotProps={{ htmlInput: { minLength: 8 } }}
              />
            )}
            {authMode === "signin" && (
              <button
                className="forgot-link"
                type="button"
                onClick={() => {
                  setAuthMode("forgot");
                  setAuthNotice("");
                }}
              >
                Forgot password?
              </button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={authBusy}
              fullWidth
            >
              {authBusy
                ? "Please wait…"
                : authMode === "signup"
                  ? "Create account"
                  : authMode === "forgot"
                    ? "Send reset instructions"
                    : authMode === "reset"
                      ? "Update password"
                      : "Sign in"}
            </Button>
          </form>
          <div className="auth-switch">
            {authMode === "signin" ? (
              <>
                New to Workline?{" "}
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthNotice("");
                  }}
                >
                  Join now
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthNotice("");
                    setAuthError("");
                  }}
                >
                  Back to sign in
                </button>
                {authMode === "signup" && (
                  <>
                    {" "}
                    · Already a member?{" "}
                    <button onClick={() => setAuthMode("signin")}>
                      Sign in
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="auth-privacy">
            <MailOutlineRounded /> Your information is encrypted and never sold.
          </div>
        </DialogContent>
      </Dialog>

      {authNotice && !authOpen && (
        <div className="toast" role="status">
          {authNotice}
          <button onClick={() => setAuthNotice("")} aria-label="Dismiss">
            <CloseRounded />
          </button>
        </div>
      )}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={section === label ? "selected" : ""}
            onClick={() => setSection(label)}
          >
            <Icon />
            <span>
              {label === "My network"
                ? "Network"
                : label === "Notifications"
                  ? "Alerts"
                  : label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
