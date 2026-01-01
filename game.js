kaboom({
    background: [20, 20, 40], // Dark Purple background
})

// Load Sprites
loadGameSprites()
// Load Sounds
loadGameSounds()

// Define gravity
setGravity(1600)

// Global Stats
const playerStats = {
    speed: 320,
    fireRate: 0.5,
    bulletCount: 1,
    bulletSpeed: 800,
    bulletSpeed: 800,
    maxHp: 3,
    isAutoFire: false,
}

scene("game", ({ wave } = { wave: 1 }) => {
    // Wave Logic
    let totalEnemies = 10 + (wave - 1) * 5
    let enemiesSpawned = 0
    let enemiesDefeated = 0

    // UI: Wave and Enemies Left
    add([
        text(`Wave ${wave}`, { size: 24 }),
        pos(20, 20),
        fixed(),
    ])

    const uiEnemies = add([
        text(`Enemies: ${totalEnemies}`, { size: 24 }),
        pos(width() - 200, 20),
        fixed(),
    ])

    // UI: Hearts
    let hp = playerStats.maxHp
    const hpLabel = add([
        text("HP: " + hp, { size: 32 }),
        pos(width() / 2, 20),
        anchor("center"),
        fixed(),
        "hpLabel"
    ])

    // Ground
    // Use tiled sprite for ground
    for (let i = 0; i < width() / 32; i++) {
        add([
            sprite("ground"),
            pos(i * 32, height() - 32),
            area(),
            body({ isStatic: true }),
            "ground",
        ])
    }
    // Invisible floor for collision if tiles have gaps, 
    // or just rely on tiles. Let's add a solid invisible block underneath just in case.
    add([
        rect(width(), 48),
        pos(0, height() - 32),
        opacity(0),
        area(),
        body({ isStatic: true }),
        "ground_collider"
    ])

    // Player
    const player = add([
        sprite("wizard"),
        pos(100, 100),
        area({ scale: 0.8 }), // Slightly smaller hitbox
        body(),
        health(playerStats.maxHp),
        "player",
        {
            isInvulnerable: false,
        }
    ])

    // Weapon System
    const staff = player.add([
        rect(24, 6),
        pos(0, 0),
        anchor("left"),
        color(255, 255, 0), // Yellow
        rotate(0),
    ])

    staff.onUpdate(() => {
        // Calculate angle from player to mouse
        staff.angle = mousePos().sub(player.pos).angle()
    })

    // Controls
    const JUMP_FORCE = 600
    let lastShootTime = 0

    onKeyDown("left", () => {
        player.move(-playerStats.speed, 0)
        player.flipX = true // Face left
    })

    onKeyDown("right", () => {
        player.move(playerStats.speed, 0)
        player.flipX = false // Face right
    })

    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(JUMP_FORCE)
        }
    })

    // Screen Wrapping
    player.onUpdate(() => {
        if (player.pos.x < 0) {
            player.pos.x = width()
        } else if (player.pos.x > width()) {
            player.pos.x = 0
        }
    })

    // Shooting Helper
    function shoot() {
        if (time() - lastShootTime < playerStats.fireRate) return
        lastShootTime = time()

        // Calculate angle and direction from player to mouse
        const baseAngle = mousePos().sub(player.pos).angle()
        const centerDir = mousePos().sub(player.pos).unit()

        // Multishot Logic
        const count = playerStats.bulletCount
        const spacing = 15 // degrees between bullets

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing
            const angle = baseAngle + offset

            const b = add([
                circle(6),
                pos(player.pos.add(centerDir.scale(20))),
                color(255, 0, 0), // Red
                move(angle, playerStats.bulletSpeed),
                offscreen({ destroy: true }),
                area(),
                "bullet",
            ])

            // Bullet Trail
            b.onUpdate(() => {
                add([
                    circle(b.radius),
                    pos(b.pos),
                    color(255, 100, 100),
                    opacity(0.5),
                    scale(0.8),
                    lifespan(0.1),
                ])
            })
        }

        play("shoot", { volume: 0.5, detune: rand(-200, 200) })
        shake(2) // Screen shake
    }

    // Shooting Input
    onMouseDown("left", shoot)

    // Auto-fire Toggle
    const autoFireLabel = add([
        text("Auto-fire: OFF", { size: 16 }),
        pos(width() - 200, 50),
        fixed(),
        color(255, 255, 255)
    ])

    onKeyPress("q", () => {
        playerStats.isAutoFire = !playerStats.isAutoFire
        autoFireLabel.text = `Auto-fire: ${playerStats.isAutoFire ? "ON" : "OFF"}`
        autoFireLabel.color = playerStats.isAutoFire ? rgb(0, 255, 0) : rgb(255, 255, 255)
    })

    // Auto-fire Logic
    onUpdate(() => {
        if (playerStats.isAutoFire) {
            shoot()
        }
    })

    // Enemy Spawning
    const spawnTimer = loop(1.5, () => {
        if (enemiesSpawned >= totalEnemies) {
            spawnTimer.cancel() // Stop spawning
            return
        }
        enemiesSpawned++

        const isEye = rand() > 0.6 // 40% chance for Eye
        const spawnX = rand(0, width())

        if (isEye) {
            // Shoots bullets, stays at a distance
            const enemy = add([
                sprite("eye"),
                pos(spawnX, -32),
                area(),
                body({ gravityScale: 0 }), // Fly
                "enemy",
                "eye",
                { shootTimer: 0 }
            ])

            enemy.onUpdate(() => {
                // Screen Wrapping for Enemies
                if (enemy.pos.x < -32) enemy.pos.x = width() + 32
                if (enemy.pos.x > width() + 32) enemy.pos.x = -32
                // Optional: vertical wrapping if they fly too high/low? 
                // Let's just keep X wrapping to prevent losing them.

                // Move down until some height, then hover
                let targetY = 200
                if (enemy.pos.y < targetY) {
                    enemy.move(0, 100)
                } else {
                    // Hover movement
                    enemy.move(Math.sin(time() * 3) * 50, 0)
                }

                // Shoot at player
                enemy.shootTimer += dt()
                if (enemy.shootTimer > 2) {
                    enemy.shootTimer = 0
                    const dir = player.pos.sub(enemy.pos).unit()
                    add([
                        circle(6),
                        pos(enemy.pos),
                        color(0, 255, 0),
                        move(player.pos.sub(enemy.pos).angle(), 300),
                        area(),
                        offscreen({ destroy: true }),
                        "enemyBullet"
                    ])
                }
            })

        } else {
            // Bat: Fast, homing
            const enemy = add([
                sprite("bat"),
                pos(spawnX, -32),
                area(),
                body({ gravityScale: 0 }), // Fly
                "enemy",
                "bat"
            ])

            enemy.onUpdate(() => {
                // Screen Wrapping for Enemies
                if (enemy.pos.x < -32) enemy.pos.x = width() + 32
                if (enemy.pos.x > width() + 32) enemy.pos.x = -32

                const dir = player.pos.sub(enemy.pos).unit()
                enemy.move(dir.scale(150)) // Faster than before
            })
        }
    })

    // Collisions
    // Bullet vs Enemy
    onCollide("bullet", "enemy", (b, e) => {
        destroy(b)
        destroy(e)
        play("explosion", { volume: 0.6, detune: rand(-200, 200) })
        shake(2)
        enemiesDefeated++
        uiEnemies.text = `Enemies: ${totalEnemies - enemiesDefeated}`

        // Particle explosion
        for (let i = 0; i < 8; i++) {
            add([
                circle(rand(2, 6)),
                pos(e.pos),
                color(255, 100, 0),
                move(rand(0, 360), rand(50, 200)),
                opacity(1),
                lifespan(0.3),
            ])
        }

        if (enemiesDefeated >= totalEnemies) {
            wait(1, () => {
                go("upgrades", { wave: wave + 1 })
            })
        }
    })

    // Helper: Player Hurt Logic
    function playerTakeDamage() {
        if (player.isInvulnerable) return

        player.hurt(1)
        hpLabel.text = "HP: " + player.hp()
        shake(20)
        play("explosion") // Use explosion sound for hit for now, or gen new one

        if (player.hp() <= 0) {
            go("gameover", { wave })
            play("gameover")
        } else {
            // Invulnerability
            player.isInvulnerable = true
            const flash = loop(0.1, () => {
                player.opacity = player.opacity === 1 ? 0.5 : 1
            })

            wait(1, () => {
                player.isInvulnerable = false
                flash.cancel()
                player.opacity = 1
            })
        }
    }

    // Enemy Bullet vs Player
    onCollide("enemyBullet", "player", (b, p) => {
        destroy(b)
        playerTakeDamage()
    })

    // Enemy vs Player
    onCollide("enemy", "player", (e, p) => {
        // Optional: Destroy enemy on contact? Or just bounce/hurt?
        // Let's destroy enemy to prevent stunlock, or push back.
        // For simplicity: destroy enemy, player takes damage.
        destroy(e)
        playerTakeDamage()
    })
})

// Upgrades Scene
scene("upgrades", ({ wave }) => {
    // Play powerup sound on entry (or maybe on select? let's do on select)

    add([
        text(`WAVE ${wave - 1} COMPLETED!`),
        pos(width() / 2, height() / 2 - 150),
        anchor("center"),
        color(255, 215, 0) // Gold
    ])

    add([
        text("Choose an Upgrade:", { size: 24 }),
        pos(width() / 2, height() / 2 - 100),
        anchor("center"),
    ])

    const options = [
        { key: "1", label: "Multishot", desc: "+1 Bullet Stream", action: () => playerStats.bulletCount++ },
        { key: "2", label: "Rapid Fire", desc: "+20% Fire Rate", action: () => playerStats.fireRate *= 0.8 },
        { key: "3", label: "Speed Up", desc: "+50 Move Speed", action: () => playerStats.speed += 50 },
    ]

    options.forEach((opt, idx) => {
        const yPos = height() / 2 - 40 + idx * 80

        // Card Box
        const btn = add([
            rect(300, 60, { radius: 8 }),
            pos(width() / 2, yPos),
            anchor("center"),
            area(),
            scale(1),
            color(0, 0, 0),
            outline(4, rgb(255, 255, 255)),
            "upgradeBtn",
            { option: opt }
        ])

        // Text
        btn.add([
            text(opt.label, { size: 20 }),
            pos(0, -10),
            anchor("center"),
            color(255, 255, 255)
        ])

        btn.add([
            text(opt.desc, { size: 14 }),
            pos(0, 15),
            anchor("center"),
            color(200, 200, 200)
        ])

        // Key Hint
        add([
            text(`[${opt.key}]`, { size: 16 }),
            pos(width() / 2 - 180, yPos),
            anchor("right"),
            color(150, 150, 150)
        ])

        // Interaction
        btn.onClick(() => {
            play("powerup")
            opt.action()
            go("game", { wave })
        })

        btn.onHover(() => {
            btn.color = rgb(40, 40, 60)
            btn.scale = vec2(1.1)
        })

        btn.onHoverEnd(() => {
            btn.color = rgb(0, 0, 0)
            btn.scale = vec2(1)
        })
    })

    // Keyboard support
    options.forEach((opt) => {
        onKeyPress(opt.key, () => {
            play("powerup")
            opt.action()
            go("game", { wave })
        })
    })
})

// Game Over Scene
scene("gameover", ({ wave }) => {
    add([
        text("GAME OVER"),
        pos(width() / 2, height() / 2),
        anchor("center"),
    ])

    add([
        text(`Wave Reached: ${wave}`, { size: 24 }),
        pos(width() / 2, height() / 2 + 50),
        anchor("center"),
    ])

    add([
        text("Press R or Click to Restart", { size: 24 }),
        pos(width() / 2, height() / 2 + 100),
        anchor("center"),
    ])

    // Reset stats on restart
    const restart = () => {
        playerStats.speed = 320
        playerStats.fireRate = 0.5
        playerStats.bulletCount = 1
        playerStats.bulletSpeed = 800
        go("game", { wave: 1 })
    }

    onKeyPress("r", restart)
    onMousePress(restart)
})

// Start the game
go("game", { wave: 1 })
