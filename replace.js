const fs = require('fs');
let content = fs.readFileSync('src/app/(portal)/admin/page.tsx', 'utf8');
content = content.replace(/<Tabs value=\{activeTab\} onValueChange=\{handleTabChange\}>[\s\S]*?<\/TabsList>\s*<\/div>/, <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col lg:flex-row gap-8 w-full items-start">
        {/* Sidebar Navigation for Admin Panel */}
        <div className="w-full lg:w-64 shrink-0 sticky top-24">
          <TabsList className="flex flex-row lg:flex-col h-auto w-full bg-transparent p-0 gap-2 overflow-x-auto lg:overflow-visible justify-start items-start no-scrollbar">
            
            <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-4 mt-2">
              Communication
            </div>
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
              <TabsTrigger value="announcements" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <Megaphone className="h-4 w-4 mr-3" /> Announcements
              </TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'academic_rep') && (
              <TabsTrigger value="resources" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <LibraryBig className="h-4 w-4 mr-3" /> Resources & Kuppi
              </TabsTrigger>
            )}

            <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-4 mt-6">
              Administration
            </div>

            {(isSuperAdmin || user.role === 'rep') && (
              <>
                <TabsTrigger value="users" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                  <Users className="h-4 w-4 mr-3" /> User Management
                </TabsTrigger>
                <TabsTrigger value="profile_updates" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                  <UserCog className="h-4 w-4 mr-3" /> Profile Updates
                </TabsTrigger>
                <TabsTrigger value="feedback" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                  <MessageSquare className="h-4 w-4 mr-3" /> Feedback & Complaints
                </TabsTrigger>
                <TabsTrigger value="settings" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                  <Settings className="h-4 w-4 mr-3" /> Directory Settings
                </TabsTrigger>
              </>
            )}

            <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-4 mt-6">
              Academics
            </div>

            {(isSuperAdmin || user.role === 'rep' || user.role === 'academic_rep') && (
              <TabsTrigger value="subjects" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <Plus className="h-4 w-4 mr-3" /> Modules / Subjects
              </TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep') && (
              <TabsTrigger value="combinations" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <LibraryBig className="h-4 w-4 mr-3" /> Subject Combinations
              </TabsTrigger>
            )}

            {isSuperAdmin && (
              <TabsTrigger value="cohorts" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <FolderGit2 className="h-4 w-4 mr-3" /> Cohorts Management
              </TabsTrigger>
            )}

            <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-4 mt-6">
              Operations
            </div>

            {(isSuperAdmin || user.role === 'rep' || user.role === 'treasurer') && (
              <TabsTrigger value="finances" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <ShieldAlert className="h-4 w-4 mr-3" /> Financial Records
              </TabsTrigger>
            )}

            {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
              <TabsTrigger value="public" className="w-full justify-start text-left px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg whitespace-nowrap">
                <Sparkles className="h-4 w-4 mr-3" /> Public Website
              </TabsTrigger>
            )}
            
          </TabsList>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0 w-full">);
fs.writeFileSync('src/app/(portal)/admin/page.tsx', content);
